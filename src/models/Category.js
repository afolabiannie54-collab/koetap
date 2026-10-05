import mongoose from "mongoose";

// A product category a store owner created ("Drinks", "Snacks"). Products still carry the category's name,
// so everything that already filters by category keeps working; this collection is the owner's list of
// choices, so a category is picked from a dropdown instead of typed out every time.
const CategorySchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true },
    // Lower-cased name: "drinks" and "Drinks" are the same category
    nameKey: { type: String, required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ storeId: 1, nameKey: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
