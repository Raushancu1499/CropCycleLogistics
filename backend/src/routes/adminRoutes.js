import express from "express";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import {
  createAdRevenueEntry,
  getAdminDashboard,
  updateInsuranceStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, requireRole("admin"), getAdminDashboard);
router.post("/ad-revenue", authMiddleware, requireRole("admin"), createAdRevenueEntry);
router.put(
  "/insurance/:id/status",
  authMiddleware,
  requireRole("admin"),
  updateInsuranceStatus
);

export default router;
