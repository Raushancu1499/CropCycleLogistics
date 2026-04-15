import Order from "../models/order.js";
import Product from "../models/Product.js";
import { sendNotification } from "../utils/sendNotification.js";

const validStatuses = ["pending", "approved", "rejected", "on_route", "delivered"];
const statusTransitions = {
  pending: ["approved", "rejected"],
  approved: ["on_route"],
  on_route: ["delivered"],
};

export const placeOrder = async (req, res) => {
  try {
    if (req.user?.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can place orders" });
    }

    const {
      productId,
      quantity,
      deliveryMode = "buyer_pickup",
      distanceKm = 0,
    } = req.body;
    const normalizedQuantity = Number(quantity);
    const normalizedDistance = Math.max(Number(distanceKm) || 0, 0);

    if (!productId || !normalizedQuantity || normalizedQuantity <= 0) {
      return res.status(400).json({ message: "Please provide a valid quantity" });
    }

    const product = await Product.findById(productId).populate(
      "farmerId",
      "name location phone"
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (String(product.farmerId._id) === req.user.id) {
      return res.status(400).json({ message: "You cannot order your own product" });
    }
    if (product.quantity < normalizedQuantity) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    const productCost = normalizedQuantity * product.pricePerUnit;
    const deliveryFee = deliveryMode === "farmer_delivery" ? normalizedDistance * 8 : 0;
    const totalCost = productCost + deliveryFee;

    product.quantity -= normalizedQuantity;
    await product.save();

    const order = await Order.create({
      buyerId: req.user.id,
      farmerId: product.farmerId._id,
      productId,
      quantity: normalizedQuantity,
      deliveryMode,
      distanceKm: normalizedDistance,
      deliveryFee,
      totalCost,
      status: "pending",
    });

    await sendNotification(
      product.farmerId._id,
      `New order request for ${normalizedQuantity} ${product.unit} of ${product.name}.`,
      {
        title: "New order request",
        type: "info",
        link: "/farmer-orders",
      }
    );

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFarmerOrders = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can view these orders" });
    }

    const orders = await Order.find({ farmerId: req.user.id })
      .populate("productId", "name unit pricePerUnit")
      .populate("buyerId", "name phone location")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBuyerOrders = async (req, res) => {
  try {
    if (req.user?.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can view these orders" });
    }

    const orders = await Order.find({ buyerId: req.user.id })
      .populate("productId", "name unit pricePerUnit")
      .populate("farmerId", "name phone location")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can update order status" });
    }

    const { status } = req.body;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      farmerId: req.user.id,
    }).populate("productId buyerId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const allowedNextStatuses = statusTransitions[order.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Orders in ${order.status} can only move to ${
          allowedNextStatuses.join(", ") || "no further status"
        }`,
      });
    }

    if (status === "rejected") {
      order.productId.quantity += order.quantity;
      await order.productId.save();
    }

    order.status = status;
    await order.save();

    await sendNotification(
      order.buyerId._id,
      `Your order for ${order.productId.name} is now ${status.replace("_", " ")}.`,
      {
        title: "Order status updated",
        type: status === "rejected" ? "warning" : "success",
        link: "/buyer-orders",
      }
    );

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
