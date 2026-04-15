import AdRevenue from "../models/AdRevenue.js";
import Insurance from "../models/Insurance.js";
import Order from "../models/order.js";
import Product from "../models/Product.js";
import Requirement from "../models/Requirement.js";
import User from "../models/User.js";
import { MARKETPLACE_COMMISSION_RATE } from "../config/businessRules.js";
import { sendNotification } from "../utils/sendNotification.js";

const formatPeople = (list) =>
  list.map((person) => ({
    id: person._id,
    name: person.name,
    phone: person.phone,
    email: person.email || "",
    location: person.location,
    role: person.role,
    createdAt: person.createdAt,
  }));

const serializeRequirementForAdmin = (requirement) => {
  const raw = requirement.toObject ? requirement.toObject() : requirement;
  const responses = Array.isArray(raw.responses)
    ? raw.responses.filter((response) => response.status !== "withdrawn")
    : [];
  const selectedResponse =
    responses.find((response) => response.status === "selected") || null;

  return {
    ...raw,
    status:
      raw.status === "closed"
        ? "closed"
        : selectedResponse
          ? "matched"
          : responses.length || raw.status === "in_review"
            ? "in_review"
            : "open",
    responseCount: responses.length,
    selectedResponse,
  };
};

export const getAdminDashboard = async (_req, res) => {
  try {
    const [
      users,
      products,
      orders,
      requirements,
      policies,
      adRevenueEntries,
    ] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Product.find()
        .populate("farmerId", "name phone location")
        .sort({ createdAt: -1 }),
      Order.find()
        .populate("buyerId", "name phone location")
        .populate("farmerId", "name phone location")
        .populate("productId", "name unit pricePerUnit")
        .sort({ createdAt: -1 }),
      Requirement.find()
        .populate("buyerId", "name phone location")
        .populate("acceptedBy", "name phone location")
        .sort({ createdAt: -1 }),
      Insurance.find()
        .populate("farmerId", "name phone location")
        .sort({ createdAt: -1 }),
      AdRevenue.find().sort({ createdAt: -1 }),
    ]);

    const farmers = users.filter((user) => user.role === "farmer");
    const buyers = users.filter((user) => user.role === "buyer");
    const admins = users.filter((user) => user.role === "admin");
    const deliveredOrders = orders.filter((order) => order.status === "delivered");
    const marketplaceSalesValue = deliveredOrders.reduce(
      (sum, order) => sum + Number(order.totalCost || 0),
      0
    );
    const marketplaceCommissionRevenue = marketplaceSalesValue * MARKETPLACE_COMMISSION_RATE;
    const insuranceRevenue = policies.reduce(
      (sum, policy) => sum + Number(policy.premiumAmount || 0),
      0
    );
    const adRevenue = adRevenueEntries
      .filter((entry) => entry.paymentStatus === "received")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    res.json({
      overview: {
        totalUsers: users.length,
        totalAdmins: admins.length,
        totalFarmers: farmers.length,
        totalBuyers: buyers.length,
        activeListings: products.filter((product) => Number(product.quantity) > 0).length,
        totalOrders: orders.length,
        openRequirements: requirements.filter((item) => item.status !== "closed").length,
        insuranceApplications: policies.length,
      },
      revenue: {
        marketplaceSalesValue,
        marketplaceCommissionRate: MARKETPLACE_COMMISSION_RATE,
        marketplaceCommissionRevenue,
        insuranceRevenue,
        adRevenue,
        totalPlatformRevenue:
          marketplaceCommissionRevenue + insuranceRevenue + adRevenue,
      },
      admins: formatPeople(admins),
      farmers: formatPeople(farmers),
      buyers: formatPeople(buyers),
      products,
      orders,
      requirements: requirements.map((requirement) =>
        serializeRequirementForAdmin(requirement)
      ),
      policies,
      adRevenueEntries,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Failed to load admin dashboard" });
  }
};

export const createAdRevenueEntry = async (req, res) => {
  try {
    const {
      advertiserName,
      campaignName,
      placement,
      amount,
      paymentStatus = "received",
      notes = "",
    } = req.body;

    const normalizedAmount = Number(amount);

    if (!advertiserName || !campaignName || !placement || !normalizedAmount) {
      return res.status(400).json({ message: "All required ad fields must be filled" });
    }

    const entry = await AdRevenue.create({
      advertiserName: advertiserName.trim(),
      campaignName: campaignName.trim(),
      placement,
      amount: normalizedAmount,
      paymentStatus,
      notes: notes.trim(),
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error("Create ad revenue error:", error);
    res.status(500).json({ message: "Failed to create ad revenue entry" });
  }
};

export const updateInsuranceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid insurance status" });
    }

    const policy = await Insurance.findById(req.params.id).populate(
      "farmerId",
      "name phone"
    );

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    policy.status = status;
    await policy.save();

    await sendNotification(
      policy.farmerId._id,
      `Your insurance policy ${policy.policyNumber} is now ${status}.`,
      {
        title: "Insurance status updated",
        type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
        link: "/insurance",
      }
    );

    res.json({ message: "Insurance policy updated successfully", policy });
  } catch (error) {
    console.error("Update insurance status error:", error);
    res.status(500).json({ message: "Failed to update insurance policy" });
  }
};
