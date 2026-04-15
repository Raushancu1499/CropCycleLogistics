import mongoose from "mongoose";

const insuranceSchema = new mongoose.Schema(
  {
    policyNumber: {
      type: String,
      default: () =>
        `CCI-${Date.now().toString(36).toUpperCase()}-${Math.floor(
          100 + Math.random() * 900
        )}`,
      unique: true,
    },
    planName: { type: String, default: "Crop Shield Standard" },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cropName: { type: String, required: true, trim: true },
    areaSize: { type: String, required: true, trim: true },
    disasterType: { type: String, required: true, trim: true },
    claimAmount: { type: Number, required: true, min: 0 },
    premiumAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Insurance", insuranceSchema);
