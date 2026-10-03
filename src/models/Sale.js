import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    total: { type: Number },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cashierName: { type: String, required: true },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "transfer", "other"], required: true },
    note: { type: String },
    receiptSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Every report filters by store and date range, and sorts by date.
SaleSchema.index({ storeId: 1, createdAt: -1 });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
