import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },
    role: { type: String, enum: ["superadmin", "owner", "cashier"], default: "owner" },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", default: null },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
