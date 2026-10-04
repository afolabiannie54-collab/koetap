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
    // Chosen by the POS screen for each sale. Sending the same one twice (a double tap, or a retry
    // after a dropped connection) returns the sale that already exists instead of making another.
    clientRef: { type: String },
  },
  { timestamps: true }
);

// Every report filters by store and date range, and sorts by date.
SaleSchema.index({ storeId: 1, createdAt: -1 });
// One sale per reference per store. Older sales have no reference, so the index skips them.
SaleSchema.index({ storeId: 1, clientRef: 1 }, { unique: true, partialFilterExpression: { clientRef: { $type: "string" } } });
// The admin dashboard looks sales up by business, and lists the newest across the platform.
SaleSchema.index({ businessId: 1, createdAt: -1 });
SaleSchema.index({ createdAt: -1 });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
