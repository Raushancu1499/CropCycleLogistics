import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Chat from "./models/Chat.js";
import Order from "./models/order.js";

let io;

/**
 * Initialise Socket.IO on the given HTTP server.
 * Returns the io instance so it can be shared if needed.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
  });

  // ── Authentication middleware ──────────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
      socket.user = decoded; // { id, role, name }
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`[Socket] Connected: ${user.name} (${user.role}) — ${socket.id}`);

    // User joins their personal room so we can push targeted events
    socket.join(`user:${user.id}`);

    // ── Join order chat room ───────────────────────────────────────────────
    socket.on("join_order_chat", async ({ orderId }) => {
      try {
        // Verify user belongs to this order
        const order = await Order.findById(orderId);
        if (!order) return socket.emit("error", { message: "Order not found" });

        const isParty =
          order.buyerId.toString() === user.id ||
          order.farmerId.toString() === user.id ||
          user.role === "admin";

        if (!isParty) return socket.emit("error", { message: "Access denied" });

        const room = `order:${orderId}`;
        socket.join(room);

        // Fetch or create the chat document
        let chat = await Chat.findOne({ orderId });
        if (!chat) {
          chat = await Chat.create({
            orderId,
            buyerId: order.buyerId,
            farmerId: order.farmerId,
            messages: [],
          });
        }

        // Mark all messages as read by this user
        await Chat.updateOne(
          { orderId },
          { $addToSet: { "messages.$[].readBy": user.id } }
        );

        socket.emit("chat_history", {
          orderId,
          messages: chat.messages,
        });

        console.log(`[Socket] ${user.name} joined room ${room}`);
      } catch (err) {
        console.error("[Socket] join_order_chat error:", err.message);
        socket.emit("error", { message: "Could not join chat" });
      }
    });

    // ── Send a message ─────────────────────────────────────────────────────
    socket.on("send_message", async ({ orderId, text }) => {
      try {
        if (!text?.trim()) return;

        const order = await Order.findById(orderId);
        if (!order) return socket.emit("error", { message: "Order not found" });

        const isParty =
          order.buyerId.toString() === user.id ||
          order.farmerId.toString() === user.id ||
          user.role === "admin";

        if (!isParty) return socket.emit("error", { message: "Access denied" });

        const newMessage = {
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          text: text.trim(),
          readBy: [user.id],
        };

        const chat = await Chat.findOneAndUpdate(
          { orderId },
          {
            $push: { messages: newMessage },
            $set: { lastMessageAt: new Date() },
          },
          { new: true, upsert: true }
        );

        const savedMsg = chat.messages[chat.messages.length - 1];

        // Broadcast to the order room
        io.to(`order:${orderId}`).emit("new_message", {
          orderId,
          message: savedMsg,
        });

        // Push unread notification to the OTHER party (if not in room)
        const otherUserId =
          order.buyerId.toString() === user.id
            ? order.farmerId.toString()
            : order.buyerId.toString();

        io.to(`user:${otherUserId}`).emit("chat_notification", {
          orderId,
          senderName: user.name,
          text: text.trim(),
        });
      } catch (err) {
        console.error("[Socket] send_message error:", err.message);
        socket.emit("error", { message: "Could not send message" });
      }
    });

    // ── Typing indicator ──────────────────────────────────────────────────
    socket.on("typing", ({ orderId, isTyping }) => {
      socket.to(`order:${orderId}`).emit("user_typing", {
        userId: user.id,
        userName: user.name,
        isTyping,
      });
    });

    // ── Delivery status update (farmer/admin only) ────────────────────────
    socket.on("update_delivery_status", async ({ orderId, status }) => {
      try {
        const ALLOWED_STATUSES = ["pending", "approved", "rejected", "on_route", "delivered"];
        if (!ALLOWED_STATUSES.includes(status)) {
          return socket.emit("error", { message: "Invalid status" });
        }

        if (user.role !== "farmer" && user.role !== "admin") {
          return socket.emit("error", { message: "Only farmers or admins can update delivery status" });
        }

        const order = await Order.findByIdAndUpdate(
          orderId,
          { $set: { status } },
          { new: true }
        ).populate("buyerId", "name").populate("farmerId", "name");

        if (!order) return socket.emit("error", { message: "Order not found" });

        // Push status update to both parties
        const payload = {
          orderId,
          orderCode: order.orderCode,
          status,
          updatedBy: user.name,
          updatedAt: new Date().toISOString(),
        };

        io.to(`user:${order.buyerId._id}`).emit("delivery_status_update", payload);
        io.to(`user:${order.farmerId._id}`).emit("delivery_status_update", payload);

        // Broadcast inside the order chat room too (status card)
        io.to(`order:${orderId}`).emit("delivery_status_update", payload);

        socket.emit("status_updated", payload);
      } catch (err) {
        console.error("[Socket] update_delivery_status error:", err.message);
        socket.emit("error", { message: "Could not update status" });
      }
    });

    // ── Leave room ────────────────────────────────────────────────────────
    socket.on("leave_order_chat", ({ orderId }) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${user.name} — ${socket.id}`);
    });
  });

  return io;
}

export const getIO = () => io;
