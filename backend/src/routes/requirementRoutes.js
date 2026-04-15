import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createRequirement,
  decideRequirement,
  getAvailableRequirements,
  getBuyerRequirementDashboard,
  getFarmerRequirementDashboard,
  getMyRequirements,
  respondToRequirement,
  selectRequirementResponse,
  updateRequirementStatus,
} from "../controllers/requirementController.js";

const router = express.Router();

router.get("/dashboard/buyer", authMiddleware, getBuyerRequirementDashboard);
router.get("/dashboard/farmer", authMiddleware, getFarmerRequirementDashboard);

router.post("/", authMiddleware, createRequirement);
router.get("/mine", authMiddleware, getMyRequirements);
router.get("/", authMiddleware, getAvailableRequirements);
router.get("/market", authMiddleware, getAvailableRequirements);

router.post("/:id/respond", authMiddleware, respondToRequirement);
router.put("/:id/responses/:responseId/select", authMiddleware, selectRequirementResponse);
router.put("/:id/status", authMiddleware, updateRequirementStatus);
router.put("/:id/decision", authMiddleware, decideRequirement);

export default router;
