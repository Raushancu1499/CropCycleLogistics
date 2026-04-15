import Product from "../models/Product.js";
import User from "../models/User.js";

export const getFarmerProfile = async (req, res) => {
  try {
    const farmer = await User.findById(req.params.id).select("name phone location");
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const products = await Product.find({
      farmerId: req.params.id,
      quantity: { $gt: 0 },
    })
      .select("name quantity unit pricePerUnit image location description")
      .sort({ createdAt: -1 });

    res.json({
      ...farmer.toObject(),
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
