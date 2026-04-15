import mongoose from "mongoose";

const adRevenueSchema = new mongoose.Schema(
  {
    advertiserName: { type: String, required: true, trim: true },
    campaignName: { type: String, required: true, trim: true },
    placement: {
      type: String,
      enum: ["homepage_banner", "marketplace_spotlight", "dashboard_banner", "newsletter"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "received"],
      default: "received",
    },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("AdRevenue", adRevenueSchema);
