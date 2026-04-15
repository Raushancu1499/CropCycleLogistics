import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getFarmerProfile } from "../controllers/farmerController.js";

const router = express.Router();

router.get("/:id", authMiddleware, getFarmerProfile);

export default router;
