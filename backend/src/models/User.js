import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["admin", "farmer", "buyer"], required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    location: { type: String, required: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
