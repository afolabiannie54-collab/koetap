import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    address: { type: String },
    currency: { type: String, default: "NGN" },
    logoUrl: { type: String },
    accentColor: { type: String },
    receiptFooter: { type: String },
    lowStockThreshold: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
    // Set when a business suspension switched this off, so reinstating restores exactly these.
    // Never set on anything the owner had already turned off themselves.
    suspendedByBusiness: { type: Boolean },
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
