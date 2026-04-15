import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  placeOrder,
  getFarmerOrders,
  getBuyerOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", authMiddleware, placeOrder);
router.post("/create", authMiddleware, placeOrder);
router.get("/buyer", authMiddleware, getBuyerOrders);
router.get("/farmer", authMiddleware, getFarmerOrders);
router.put("/status/:id", authMiddleware, updateOrderStatus);

export default router;
