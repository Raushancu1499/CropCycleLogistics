import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getToken, getUser } from "./api";

// Derive the Socket.IO server URL from the API base URL
const SOCKET_URL =
  process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/api$/, "")
    : "http://localhost:5000";

let sharedSocket = null;

/**
 * Returns (and lazily creates) a single shared socket connection.
 * The socket is authenticated via the JWT stored in localStorage.
 */
export function getSocket() {
  if (!sharedSocket || sharedSocket.disconnected) {
    const token = getToken();
    sharedSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ["websocket"],
    });
  }
  return sharedSocket;
}

export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}

/**
 * Hook: manages chat for a single order.
 * @param {string|null} orderId  — pass null to skip connecting
 */
export function useOrderChat(orderId) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(null); // { userId, userName }
  const [connected, setConnected] = useState(false);
  const typingTimer = useRef(null);
  const user = getUser();

  useEffect(() => {
    if (!orderId) return;

    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit("join_order_chat", { orderId });
    };

    const onHistory = ({ messages: msgs }) => setMessages(msgs || []);

    const onNewMessage = ({ message }) =>
      setMessages((prev) => {
        // avoid duplicates
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

    const onTyping = ({ userId, userName, isTyping: t }) => {
      if (userId === user?.id) return;
      setIsTyping(t ? { userId, userName } : null);
    };

    if (socket.connected) {
      setConnected(true);
      socket.emit("join_order_chat", { orderId });
    }

    socket.on("connect", onConnect);
    socket.on("chat_history", onHistory);
    socket.on("new_message", onNewMessage);
    socket.on("user_typing", onTyping);

    return () => {
      socket.off("connect", onConnect);
      socket.off("chat_history", onHistory);
      socket.off("new_message", onNewMessage);
      socket.off("user_typing", onTyping);
      socket.emit("leave_order_chat", { orderId });
    };
  }, [orderId, user?.id]);

  const sendMessage = useCallback(
    (text) => {
      if (!text?.trim() || !orderId) return;
      getSocket().emit("send_message", { orderId, text });
    },
    [orderId]
  );

  const sendTyping = useCallback(
    (isTypingNow) => {
      if (!orderId) return;
      getSocket().emit("typing", { orderId, isTyping: isTypingNow });
      if (isTypingNow) {
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
          getSocket().emit("typing", { orderId, isTyping: false });
        }, 2000);
      }
    },
    [orderId]
  );

  return { messages, isTyping, connected, sendMessage, sendTyping };
}

/**
 * Hook: listens for global delivery status updates and chat notifications.
 * @param {function} onDeliveryUpdate  — called with payload when any order status changes
 * @param {function} onChatNotification — called with payload when a new chat message arrives
 */
export function useSocketEvents({ onDeliveryUpdate, onChatNotification } = {}) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    const handleDelivery = (payload) => {
      setNotifications((prev) => [
        { type: "delivery", ...payload, ts: Date.now() },
        ...prev.slice(0, 19),
      ]);
      onDeliveryUpdate?.(payload);
    };

    const handleChatNotif = (payload) => {
      setNotifications((prev) => [
        { type: "chat", ...payload, ts: Date.now() },
        ...prev.slice(0, 19),
      ]);
      onChatNotification?.(payload);
    };

    socket.on("delivery_status_update", handleDelivery);
    socket.on("chat_notification", handleChatNotif);

    return () => {
      socket.off("delivery_status_update", handleDelivery);
      socket.off("chat_notification", handleChatNotif);
    };
  }, [onDeliveryUpdate, onChatNotification]);

  return { notifications };
}
