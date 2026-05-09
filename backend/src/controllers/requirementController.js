import Requirement from "../models/Requirement.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/order.js";
import { sendNotification } from "../utils/sendNotification.js";

const urgencyRank = { routine: 0, priority: 1, urgent: 2 };
const responseStatusRank = { selected: 0, submitted: 1, declined: 2, withdrawn: 3 };

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

const trimText = (value = "") => String(value || "").trim();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildLegacySelectedResponse = (requirement) => {
  if (!requirement.acceptedBy) {
    return null;
  }

  return {
    _id: requirement.selectedResponseId || requirement.acceptedBy?._id || requirement.acceptedBy,
    farmerId: requirement.acceptedBy,
    farmerName: requirement.acceptedBy?.name || "Matched farmer",
    farmerLocation: requirement.acceptedBy?.location || "",
    farmerPhone: requirement.farmerContact || requirement.acceptedBy?.phone || "",
    proposedQuantity: requirement.quantity,
    unitPrice: requirement.budgetPerUnit || 0,
    earliestFulfillmentDate: requirement.neededDate,
    deliveryMode:
      requirement.preferredDeliveryMode === "farmer_delivery"
        ? "farmer_delivery"
        : "buyer_pickup",
    responseMessage: requirement.responseMessage || "",
    status: "selected",
    createdAt: requirement.updatedAt,
    updatedAt: requirement.updatedAt,
  };
};

const serializeRequirement = (requirement, viewerId = "") => {
  const raw = requirement.toObject ? requirement.toObject() : requirement;
  let responses = Array.isArray(raw.responses) ? [...raw.responses] : [];
  const selectedResponse =
    responses.find((response) => response.status === "selected") ||
    buildLegacySelectedResponse(raw);

  if (
    selectedResponse &&
    !responses.some((response) => toIdString(response._id) === toIdString(selectedResponse._id))
  ) {
    responses = [...responses, selectedResponse];
  }

  const visibleResponses = responses
    .filter((response) => response.status !== "withdrawn")
    .sort((left, right) => {
      const statusDiff =
        (responseStatusRank[left.status] ?? 99) - (responseStatusRank[right.status] ?? 99);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt);
    });

  const normalizedStatus =
    raw.status === "closed"
      ? "closed"
      : visibleResponses.some((response) => response.status === "selected") || raw.status === "matched"
        ? "matched"
        : visibleResponses.length > 0 || raw.status === "in_review"
          ? "in_review"
          : "open";

  const myResponse = viewerId
    ? visibleResponses.find((response) => toIdString(response.farmerId) === toIdString(viewerId)) || null
    : null;

  const selected = visibleResponses.find((response) => response.status === "selected") || null;

  return {
    ...raw,
    status: normalizedStatus,
    responses: visibleResponses,
    selectedResponse: selected,
    responseCount: visibleResponses.length,
    openResponseCount: visibleResponses.filter((response) => response.status === "submitted").length,
    myResponse,
  };
};

const buildResponseSummary = (requirement, response) => ({
  _id: response._id,
  requirementId: requirement._id,
  productName: requirement.productName,
  quantity: requirement.quantity,
  unit: requirement.unit,
  neededDate: requirement.neededDate,
  urgency: requirement.urgency,
  buyer: requirement.buyerId,
  farmerId: response.farmerId,
  farmerName: response.farmerName,
  farmerLocation: response.farmerLocation,
  farmerPhone: response.farmerPhone,
  proposedQuantity: response.proposedQuantity,
  unitPrice: response.unitPrice,
  earliestFulfillmentDate: response.earliestFulfillmentDate,
  deliveryMode: response.deliveryMode,
  responseMessage: response.responseMessage,
  status: response.status,
  createdAt: response.createdAt,
  updatedAt: response.updatedAt,
});

const markRequirementMatched = (requirement, selectedResponse) => {
  requirement.responses.forEach((response) => {
    if (toIdString(response._id) === toIdString(selectedResponse._id)) {
      response.status = "selected";
    } else if (response.status !== "withdrawn") {
      response.status = "declined";
    }
  });

  requirement.status = "matched";
  requirement.selectedResponseId = selectedResponse._id;
  requirement.acceptedBy = selectedResponse.farmerId;
  requirement.farmerContact = selectedResponse.farmerPhone || "";
  requirement.responseMessage = trimText(selectedResponse.responseMessage);
};

const reopenRequirementState = (requirement) => {
  requirement.selectedResponseId = null;
  requirement.acceptedBy = null;
  requirement.farmerContact = "";
  requirement.responseMessage = "";

  requirement.responses.forEach((response) => {
    if (response.status !== "withdrawn") {
      response.status = "submitted";
    }
  });

  requirement.status = requirement.responses.some((response) => response.status === "submitted")
    ? "in_review"
    : "open";
};

const getInventoryFit = (requirement, products) => {
  const targetName = trimText(requirement.productName).toLowerCase();
  const matches = products.filter((product) => {
    const productName = trimText(product.name).toLowerCase();
    return productName.includes(targetName) || targetName.includes(productName);
  });

  const availableQuantity = matches.reduce((sum, product) => sum + Number(product.quantity || 0), 0);
  const quantityCoverage = requirement.quantity ? Math.min(availableQuantity / requirement.quantity, 1) : 0;
  const locationMatch = matches.some(
    (product) => trimText(product.location).toLowerCase() === trimText(requirement.location).toLowerCase()
  );

  return {
    matchingProducts: matches.slice(0, 3),
    availableQuantity,
    score: Math.min(
      100,
      Math.round(quantityCoverage * 60 + (matches.length ? 20 : 0) + (locationMatch ? 20 : 0))
    ),
  };
};

export const createRequirement = async (req, res) => {
  try {
    if (req.user?.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can post requirements" });
    }

    const {
      productName,
      quantity,
      unit,
      neededDate,
      neededTime = "",
      location,
      qualityGrade = "",
      budgetPerUnit = "",
      preferredDeliveryMode = "either",
      urgency = "routine",
      packagingPreference = "",
      contactName,
      contactPhone,
      contactEmail = "",
      notes = "",
    } = req.body;

    const normalizedQuantity = toNumber(quantity);
    const normalizedBudget =
      budgetPerUnit === "" || budgetPerUnit === null || budgetPerUnit === undefined
        ? null
        : toNumber(budgetPerUnit);
    const normalizedNeededDate = toDate(neededDate);

    if (
      !trimText(productName) ||
      !normalizedQuantity ||
      !unit ||
      !normalizedNeededDate ||
      !trimText(location) ||
      !trimText(contactName) ||
      !trimText(contactPhone)
    ) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (normalizedBudget !== null && normalizedBudget < 0) {
      return res.status(400).json({ message: "Budget must be zero or more" });
    }

    const requirement = await Requirement.create({
      buyerId: req.user.id,
      productName: trimText(productName),
      quantity: normalizedQuantity,
      unit,
      neededDate: normalizedNeededDate,
      neededTime: trimText(neededTime),
      location: trimText(location),
      qualityGrade: trimText(qualityGrade),
      budgetPerUnit: normalizedBudget,
      preferredDeliveryMode,
      urgency,
      packagingPreference: trimText(packagingPreference),
      contactName: trimText(contactName),
      contactPhone: trimText(contactPhone),
      contactEmail: trimText(contactEmail),
      notes: trimText(notes),
      status: "open",
    });

    res.status(201).json(serializeRequirement(requirement));
  } catch (error) {
    console.error("Error creating requirement:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyRequirements = async (req, res) => {
  try {
    if (req.user?.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can view their requirements" });
    }

    const list = await Requirement.find({ buyerId: req.user.id })
      .populate("buyerId", "name phone location")
      .populate("acceptedBy", "name phone location")
      .sort({ createdAt: -1 });

    res.json(list.map((requirement) => serializeRequirement(requirement)));
  } catch (error) {
    console.error("Error loading buyer requirements:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableRequirements = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can view this board" });
    }

    const list = await Requirement.find({
      $or: [
        { status: { $in: ["open", "in_review", "matched", "accepted"] } },
        { "responses.farmerId": req.user.id },
        { acceptedBy: req.user.id },
      ],
    })
      .populate("buyerId", "name phone location")
      .sort({ createdAt: -1 });

    const serialized = list
      .map((requirement) => serializeRequirement(requirement, req.user.id))
      .filter(
        (requirement) =>
          ["open", "in_review"].includes(requirement.status) ||
          requirement.myResponse ||
          toIdString(requirement.acceptedBy) === toIdString(req.user.id)
      );

    res.json(serialized);
  } catch (error) {
    console.error("Error loading farmer requirements:", error);
    res.status(500).json({ message: error.message });
  }
};

export const respondToRequirement = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can respond to requirements" });
    }

    const requirement = await Requirement.findById(req.params.id).populate("buyerId", "name");
    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    const requirementView = serializeRequirement(requirement, req.user.id);
    const selectedFarmerId = toIdString(requirementView.selectedResponse?.farmerId);
    if (selectedFarmerId && selectedFarmerId !== toIdString(req.user.id)) {
      return res.status(400).json({ message: "This requirement has already been matched" });
    }

    if (requirementView.status === "closed") {
      return res.status(400).json({ message: "This requirement is closed" });
    }

    const farmer = await User.findById(req.user.id).select("name phone location");
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const proposedQuantity = toNumber(req.body.proposedQuantity);
    const unitPrice = toNumber(req.body.unitPrice);
    const earliestFulfillmentDate = toDate(req.body.earliestFulfillmentDate || requirement.neededDate);
    const deliveryMode = req.body.deliveryMode;
    const responseMessage = trimText(req.body.responseMessage);

    if (!proposedQuantity || proposedQuantity <= 0 || unitPrice === null || !earliestFulfillmentDate || !deliveryMode) {
      return res.status(400).json({ message: "Please complete all response fields" });
    }

    let response = requirement.responses.find(
      (entry) => toIdString(entry.farmerId) === toIdString(req.user.id)
    );
    const isUpdate = Boolean(response);

    if (response && response.status === "selected") {
      return res.status(400).json({ message: "Your response has already been selected" });
    }

    if (!response) {
      response = requirement.responses.create({
        farmerId: farmer._id,
        farmerName: farmer.name,
        farmerLocation: farmer.location,
        farmerPhone: farmer.phone,
        proposedQuantity,
        unitPrice,
        earliestFulfillmentDate,
        deliveryMode,
        responseMessage,
      });

      requirement.responses.push(response);
    } else {
      response.farmerName = farmer.name;
      response.farmerLocation = farmer.location;
      response.farmerPhone = farmer.phone;
      response.proposedQuantity = proposedQuantity;
      response.unitPrice = unitPrice;
      response.earliestFulfillmentDate = earliestFulfillmentDate;
      response.deliveryMode = deliveryMode;
      response.responseMessage = responseMessage;
      response.status = "submitted";
    }

    if (requirement.status !== "matched") {
      requirement.status = "in_review";
    }

    await requirement.save();

    await sendNotification(
      requirement.buyerId._id,
      `${farmer.name} ${isUpdate ? "updated" : "submitted"} a response for ${requirement.productName}.`,
      {
        title: isUpdate ? "Response updated" : "New farmer response",
        type: "info",
        link: "/my-requests",
      }
    );

    res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? "Response updated successfully" : "Response submitted successfully",
      requirement: serializeRequirement(requirement, req.user.id),
    });
  } catch (error) {
    console.error("Error responding to requirement:", error);
    res.status(500).json({ message: error.message });
  }
};

export const selectRequirementResponse = async (req, res) => {
  try {
    if (req.user?.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can select a farmer response" });
    }

    const requirement = await Requirement.findOne({
      _id: req.params.id,
      buyerId: req.user.id,
    }).populate("buyerId", "name");

    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    const response = requirement.responses.id(req.params.responseId);
    if (!response || response.status === "withdrawn") {
      return res.status(404).json({ message: "Response not found" });
    }

    const otherFarmers = requirement.responses
      .filter(
        (entry) =>
          toIdString(entry._id) !== toIdString(response._id) && entry.status === "submitted"
      )
      .map((entry) => entry.farmerId);

    markRequirementMatched(requirement, response);
    await requirement.save();

    // Generate an official Order so the Farmer can track delivery and the Buyer can chat
    const dummyProduct = await Product.create({
      farmerId: response.farmerId,
      name: requirement.productName,
      category: "Vegetables", // default
      unit: requirement.unit,
      pricePerUnit: response.unitPrice,
      quantity: response.proposedQuantity,
      location: response.farmerLocation || "Unknown",
      description: "Auto-generated from buyer requirement match",
    });

    const order = await Order.create({
      buyerId: requirement.buyerId,
      farmerId: response.farmerId,
      productId: dummyProduct._id,
      quantity: response.proposedQuantity,
      deliveryMode: response.deliveryMode,
      distanceKm: 0,
      deliveryFee: 0,
      totalCost: response.proposedQuantity * response.unitPrice,
      status: "approved", // automatically approved since both agreed
    });

    await sendNotification(
      response.farmerId,
      `Your response for ${requirement.productName} was selected by the buyer.`,
      {
        title: "Response selected",
        type: "success",
        link: "/buyer-requests",
      }
    );

    await Promise.all(
      otherFarmers.map((farmerId) =>
        sendNotification(
          farmerId,
          `The buyer selected another response for ${requirement.productName}.`,
          {
            title: "Response not selected",
            type: "warning",
            link: "/buyer-requests",
          }
        )
      )
    );

    res.json({
      message: "Farmer response selected successfully",
      requirement: serializeRequirement(requirement),
    });
  } catch (error) {
    console.error("Error selecting requirement response:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateRequirementStatus = async (req, res) => {
  try {
    if (req.user?.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can update requirement status" });
    }

    const requirement = await Requirement.findOne({
      _id: req.params.id,
      buyerId: req.user.id,
    }).populate("buyerId", "name");

    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    const status = trimText(req.body.status).toLowerCase();

    if (status === "closed") {
      requirement.status = "closed";
    } else if (status === "open") {
      reopenRequirementState(requirement);
    } else {
      return res.status(400).json({ message: "Unsupported status update" });
    }

    await requirement.save();

    res.json({
      message: `Requirement ${status === "closed" ? "closed" : "reopened"} successfully`,
      requirement: serializeRequirement(requirement),
    });
  } catch (error) {
    console.error("Error updating requirement status:", error);
    res.status(500).json({ message: error.message });
  }
};

export const decideRequirement = async (req, res) => {
  try {
    const { decision } = req.body;

    if (decision === "close" || decision === "reopen") {
      req.body.status = decision === "close" ? "closed" : "open";
      return updateRequirementStatus(req, res);
    }

    if (decision !== "accept") {
      return res.status(400).json({ message: "Invalid decision" });
    }

    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can accept requests" });
    }

    const requirement = await Requirement.findById(req.params.id).populate("buyerId", "name");
    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    const selectedFarmerId = toIdString(requirement.acceptedBy);
    if (selectedFarmerId && selectedFarmerId !== toIdString(req.user.id)) {
      return res.status(400).json({ message: "This requirement has already been matched" });
    }

    const farmer = await User.findById(req.user.id).select("name phone location");
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const responseMessage = trimText(req.body.responseMessage);
    const response = requirement.responses.create({
      farmerId: farmer._id,
      farmerName: farmer.name,
      farmerLocation: farmer.location,
      farmerPhone: trimText(req.body.farmerContact) || farmer.phone,
      proposedQuantity: requirement.quantity,
      unitPrice:
        req.body.unitPrice !== undefined && req.body.unitPrice !== null && req.body.unitPrice !== ""
          ? toNumber(req.body.unitPrice)
          : requirement.budgetPerUnit || 0,
      earliestFulfillmentDate: toDate(req.body.earliestFulfillmentDate || requirement.neededDate),
      deliveryMode:
        req.body.deliveryMode ||
        (requirement.preferredDeliveryMode === "farmer_delivery"
          ? "farmer_delivery"
          : "buyer_pickup"),
      responseMessage,
      status: "selected",
    });

    requirement.responses = requirement.responses.filter(
      (entry) => toIdString(entry.farmerId) !== toIdString(farmer._id)
    );
    requirement.responses.push(response);
    markRequirementMatched(requirement, response);

    await requirement.save();

    // Generate an official Order so the Farmer can track delivery and the Buyer can chat
    const dummyProduct = await Product.create({
      farmerId: response.farmerId,
      name: requirement.productName,
      category: "Vegetables",
      unit: requirement.unit,
      pricePerUnit: response.unitPrice,
      quantity: response.proposedQuantity,
      location: response.farmerLocation || "Unknown",
      description: "Auto-generated from buyer requirement match",
    });

    const order = await Order.create({
      buyerId: requirement.buyerId,
      farmerId: response.farmerId,
      productId: dummyProduct._id,
      quantity: response.proposedQuantity,
      deliveryMode: response.deliveryMode,
      distanceKm: 0,
      deliveryFee: 0,
      totalCost: response.proposedQuantity * response.unitPrice,
      status: "approved",
    });

    await sendNotification(
      requirement.buyerId._id,
      responseMessage || `A farmer is ready to fulfill your request for ${requirement.productName}.`,
      {
        title: "Requirement matched",
        type: "success",
        link: "/my-requests",
      }
    );

    res.json({
      message: "Requirement updated successfully",
      requirement: serializeRequirement(requirement, req.user.id),
    });
  } catch (error) {
    console.error("Error deciding requirement:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getBuyerRequirementDashboard = async (req, res) => {
  try {
    if (req.user?.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can view this dashboard" });
    }

    const [requirements, orders] = await Promise.all([
      Requirement.find({ buyerId: req.user.id })
        .populate("buyerId", "name phone location")
        .populate("acceptedBy", "name phone location")
        .sort({ createdAt: -1 }),
      Order.find({ buyerId: req.user.id })
        .populate("productId", "name unit")
        .populate("farmerId", "name phone location")
        .sort({ createdAt: -1 }),
    ]);

    const requirementList = requirements.map((requirement) => serializeRequirement(requirement));
    const activeRequirements = requirementList.filter((requirement) => requirement.status !== "closed");

    const urgentBoard = [...activeRequirements]
      .sort((left, right) => {
        const urgencyDiff = (urgencyRank[right.urgency] ?? 0) - (urgencyRank[left.urgency] ?? 0);
        if (urgencyDiff !== 0) {
          return urgencyDiff;
        }
        return new Date(left.neededDate) - new Date(right.neededDate);
      })
      .slice(0, 4);

    const recentResponses = requirementList
      .flatMap((requirement) =>
        requirement.responses
          .filter((response) => response.status !== "declined")
          .map((response) => buildResponseSummary(requirement, response))
      )
      .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
      .slice(0, 6);

    const deliveredOrders = orders.filter((order) => order.status === "delivered");

    res.json({
      stats: {
        openRequirements: activeRequirements.filter((requirement) => requirement.status === "open").length,
        reviewingRequirements: activeRequirements.filter((requirement) => requirement.status === "in_review").length,
        matchedRequirements: requirementList.filter((requirement) => requirement.status === "matched").length,
        urgentRequirements: activeRequirements.filter((requirement) => requirement.urgency === "urgent").length,
        pendingOrders: orders.filter((order) => !["delivered", "rejected"].includes(order.status)).length,
        totalSpent: deliveredOrders.reduce((sum, order) => sum + Number(order.totalCost || 0), 0),
        responseCoverage: activeRequirements.length
          ? Math.round(
              (activeRequirements.filter((requirement) => requirement.responseCount > 0).length /
                activeRequirements.length) *
                100
            )
          : 0,
      },
      urgentBoard,
      recentResponses,
      activeOrders: orders
        .filter((order) => !["delivered", "rejected"].includes(order.status))
        .slice(0, 4),
    });
  } catch (error) {
    console.error("Error loading buyer dashboard:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getFarmerRequirementDashboard = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can view this dashboard" });
    }

    const [products, orders, requirements] = await Promise.all([
      Product.find({ farmerId: req.user.id }).sort({ createdAt: -1 }),
      Order.find({ farmerId: req.user.id })
        .populate("productId", "name unit pricePerUnit")
        .populate("buyerId", "name phone location")
        .sort({ createdAt: -1 }),
      Requirement.find({
        $or: [
          { status: { $in: ["open", "in_review", "matched", "accepted"] } },
          { "responses.farmerId": req.user.id },
          { acceptedBy: req.user.id },
        ],
      })
        .populate("buyerId", "name phone location")
        .sort({ createdAt: -1 }),
    ]);

    const requirementList = requirements
      .map((requirement) => serializeRequirement(requirement, req.user.id))
      .filter(
        (requirement) =>
          ["open", "in_review"].includes(requirement.status) ||
          requirement.myResponse ||
          toIdString(requirement.acceptedBy) === toIdString(req.user.id)
      );

    const opportunityPool = requirementList
      .filter(
        (requirement) =>
          requirement.status !== "closed" &&
          !requirement.myResponse &&
          !requirement.selectedResponse
      )
      .map((requirement) => ({
        ...requirement,
        inventoryFit: getInventoryFit(requirement, products),
      }))
      .sort((left, right) => {
        const urgencyDiff = (urgencyRank[right.urgency] ?? 0) - (urgencyRank[left.urgency] ?? 0);
        if (urgencyDiff !== 0) {
          return urgencyDiff;
        }
        const fitDiff = (right.inventoryFit?.score || 0) - (left.inventoryFit?.score || 0);
        if (fitDiff !== 0) {
          return fitDiff;
        }
        return new Date(left.neededDate) - new Date(right.neededDate);
      });

    const opportunities = opportunityPool.slice(0, 5);

    const responsePipeline = requirementList
      .filter((requirement) => requirement.myResponse)
      .sort((left, right) => {
        const statusDiff =
          (responseStatusRank[left.myResponse?.status] ?? 99) -
          (responseStatusRank[right.myResponse?.status] ?? 99);
        if (statusDiff !== 0) {
          return statusDiff;
        }
        return (
          new Date(right.myResponse?.updatedAt || right.updatedAt) -
          new Date(left.myResponse?.updatedAt || left.updatedAt)
        );
      })
      .slice(0, 5);

    const deliveredOrders = orders.filter((order) => order.status === "delivered");

    res.json({
      stats: {
        liveOpportunities: opportunityPool.length,
        submittedResponses: requirementList.filter(
          (requirement) => requirement.myResponse?.status === "submitted"
        ).length,
        acceptedMatches: requirementList.filter(
          (requirement) => toIdString(requirement.selectedResponse?.farmerId) === toIdString(req.user.id)
        ).length,
        activeOrders: orders.filter((order) => ["pending", "approved", "on_route"].includes(order.status))
          .length,
        totalRevenue: deliveredOrders.reduce((sum, order) => sum + Number(order.totalCost || 0), 0),
        inventoryItems: products.length,
      },
      opportunities,
      responsePipeline,
      lowStockProducts: products.filter((product) => Number(product.quantity || 0) <= 20).slice(0, 4),
      recentOrders: orders
        .filter((order) => ["pending", "approved", "on_route"].includes(order.status))
        .slice(0, 4),
    });
  } catch (error) {
    console.error("Error loading farmer dashboard:", error);
    res.status(500).json({ message: error.message });
  }
};
