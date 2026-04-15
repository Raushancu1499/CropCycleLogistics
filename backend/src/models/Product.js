import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    farmerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    name: { 
      type: String, 
      required: true, 
      trim: true 
    },

    quantity: { 
      type: Number, 
      required: true 
    },

    unit: { 
      type: String, 
      enum: ["kg", "quintal", "ton", "crate", "bag", "liter"],
      required: true 
    },

    pricePerUnit: { 
      type: Number, 
      required: true 
    },

    description: { 
      type: String, 
      trim: true 
    },

    location: { 
      type: String, 
      trim: true 
    },

    image: { 
      type: String 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
