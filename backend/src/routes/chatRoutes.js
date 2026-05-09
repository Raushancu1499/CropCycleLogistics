import express from "express";
import Chat from "../models/Chat.js";
import Order from "../models/order.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/chat/:orderId  — load full chat history for an order
router.get("/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isParty =
      order.buyerId.toString() === userId ||
      order.farmerId.toString() === userId ||
      req.user.role === "admin";

    if (!isParty) return res.status(403).json({ message: "Access denied" });

    const chat = await Chat.findOne({ orderId });
    if (!chat) return res.json({ orderId, messages: [] });

    // Mark all messages as read by current user
    await Chat.updateOne(
      { orderId },
      { $addToSet: { "messages.$[].readBy": userId } }
    );

    res.json({ orderId, messages: chat.messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat  — list all chats for the current user (inbox)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const filter =
      role === "buyer" ? { buyerId: userId } :
      role === "farmer" ? { farmerId: userId } :
      {}; // admin sees all

    const chats = await Chat.find(filter)
      .populate("orderId", "orderCode status")
      .populate("buyerId", "name phone")
      .populate("farmerId", "name phone")
      .sort({ lastMessageAt: -1 });

    const inbox = chats.map((c) => {
      const last = c.messages[c.messages.length - 1] || null;
      const unread = c.messages.filter(
        (m) => !m.readBy.map(String).includes(userId)
      ).length;
      return {
        orderId: c.orderId?._id,
        orderCode: c.orderId?.orderCode,
        orderStatus: c.orderId?.status,
        buyer: c.buyerId,
        farmer: c.farmerId,
        lastMessage: last,
        unreadCount: unread,
        lastMessageAt: c.lastMessageAt,
      };
    });

    res.json(inbox);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
