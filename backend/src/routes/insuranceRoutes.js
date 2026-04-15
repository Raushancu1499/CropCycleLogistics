import express from "express";
import {
  applyInsurance,
  downloadPolicy,
  getInsuranceApplications,
} from "../controllers/insuranceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/apply", authMiddleware, applyInsurance);
router.get("/", authMiddleware, getInsuranceApplications);
router.get("/download/:id", authMiddleware, downloadPolicy);

export default router;
