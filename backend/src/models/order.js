import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      default: () =>
        `CCO-${Date.now().toString(36).toUpperCase()}-${Math.floor(
          100 + Math.random() * 900
        )}`,
      unique: true,
    },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    deliveryMode: {
      type: String,
      enum: ["buyer_pickup", "farmer_delivery"],
      required: true,
    },
    distanceKm: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "on_route", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
