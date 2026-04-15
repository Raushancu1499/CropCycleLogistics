import fs from "fs";
import path from "path";
import Product from "../models/Product.js";
import Order from "../models/order.js";

export const addProduct = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can add products" });
    }

    const { name, quantity, unit, pricePerUnit, description, location } = req.body;
    const normalizedQuantity = Number(quantity);
    const normalizedPrice = Number(pricePerUnit);

    if (!name || !normalizedQuantity || !unit || !normalizedPrice || !location) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const product = await Product.create({
      farmerId: req.user.id,
      name: name.trim(),
      quantity: normalizedQuantity,
      unit,
      pricePerUnit: normalizedPrice,
      description: description?.trim() || "",
      location: location.trim(),
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    res
      .status(201)
      .json({ success: true, message: "Product added successfully", product });
  } catch (error) {
    console.error("Error while adding product:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding product",
      error: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ quantity: { $gt: 0 } })
      .populate("farmerId", "name location phone")
      .sort({ createdAt: -1 });

    res.json(Array.isArray(products) ? products : []);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error while fetching products" });
  }
};

export const getFarmerInventory = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can view inventory" });
    }

    const products = await Product.find({ farmerId: req.user.id }).sort({ createdAt: -1 });
    res.json(Array.isArray(products) ? products : []);
  } catch (error) {
    console.error("Error fetching farmer inventory:", error);
    res.status(500).json({ message: "Server error while fetching inventory" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can delete inventory" });
    }

    const product = await Product.findOne({ _id: req.params.id, farmerId: req.user.id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const activeOrders = await Order.exists({
      productId: req.params.id,
      status: { $in: ["pending", "approved", "on_route"] },
    });

    if (activeOrders) {
      return res.status(400).json({
        message: "This product has active orders and cannot be deleted yet",
      });
    }

    if (product.image) {
      const fullPath = path.join(process.cwd(), "uploads", path.basename(product.image));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error while deleting product" });
  }
};
