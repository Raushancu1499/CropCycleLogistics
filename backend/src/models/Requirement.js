import mongoose from "mongoose";

const requirementResponseSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmerName: { type: String, required: true, trim: true },
    farmerLocation: { type: String, default: "", trim: true },
    farmerPhone: { type: String, default: "", trim: true },
    proposedQuantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    earliestFulfillmentDate: { type: Date, required: true },
    deliveryMode: {
      type: String,
      enum: ["buyer_pickup", "farmer_delivery"],
      required: true,
    },
    responseMessage: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["submitted", "selected", "declined", "withdrawn"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

const RequirementSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton", "crate", "crates", "bag", "bags", "liter", "liters"],
      required: true,
    },
    neededDate: { type: Date, required: true },
    neededTime: { type: String, default: "" },
    location: { type: String, required: true, trim: true },
    qualityGrade: { type: String, default: "", trim: true },
    budgetPerUnit: { type: Number, default: null, min: 0 },
    preferredDeliveryMode: {
      type: String,
      enum: ["buyer_pickup", "farmer_delivery", "either"],
      default: "either",
    },
    urgency: {
      type: String,
      enum: ["routine", "priority", "urgent"],
      default: "routine",
    },
    packagingPreference: { type: String, default: "", trim: true },
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    contactEmail: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["open", "in_review", "matched", "accepted", "closed"],
      default: "open",
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    farmerContact: { type: String, default: "", trim: true },
    responseMessage: { type: String, default: "", trim: true },
    selectedResponseId: { type: mongoose.Schema.Types.ObjectId, default: null },
    responses: [requirementResponseSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Requirement", RequirementSchema);
