import Notification from "../models/Notification.js";

export const sendNotification = async (userId, message, options = {}) => {
  try {
    await Notification.create({
      userId,
      message,
      title: options.title || "CropCycle update",
      type: options.type || "info",
      link: options.link || "",
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
