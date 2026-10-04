import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String },
    phone: { type: String },
    plan: { type: String, default: "free" },
    // Switched off by the platform admin. Missing on older businesses, which count as active.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Business || mongoose.model("Business", BusinessSchema);
