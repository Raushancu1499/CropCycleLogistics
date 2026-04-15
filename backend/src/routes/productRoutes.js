import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  getFarmerInventory,
} from "../controllers/productController.js";

const router = express.Router();
const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({ storage });

router.get("/", getAllProducts);
router.get("/my", authMiddleware, getFarmerInventory);
router.get("/my-inventory", authMiddleware, getFarmerInventory);
router.post("/", authMiddleware, upload.single("image"), addProduct);
router.delete("/:id", authMiddleware, deleteProduct);

export default router;
