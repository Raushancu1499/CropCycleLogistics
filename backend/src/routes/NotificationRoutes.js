import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markNotificationRead,
  markNotificationsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.put("/mark-read", authMiddleware, markNotificationsRead);
router.put("/:id/read", authMiddleware, markNotificationRead);

export default router;
