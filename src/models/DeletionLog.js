import mongoose from "mongoose";

// One short entry each time something is permanently deleted: what, whose, by whom, and how much went with it.
// It holds no sales or customer data, only the fact that the deletion happened (so a super admin can answer
// "who deleted that, and when?" after the data itself is gone).
const DeletionLogSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["store", "business", "account"], required: true },
    name: { type: String }, // the store's or business's name at the time
    businessId: { type: mongoose.Schema.Types.ObjectId },
    storeId: { type: mongoose.Schema.Types.ObjectId },
    performedBy: { type: mongoose.Schema.Types.ObjectId },
    performedByEmail: { type: String },
    counts: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.DeletionLog || mongoose.model("DeletionLog", DeletionLogSchema);
