import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true },
    sku: { type: String },
    category: { type: String },
    price: { type: Number, required: true },
    costPrice: { type: Number },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Products are always read per store.
ProductSchema.index({ storeId: 1 });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
