import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";

import { CATEGORY_MAX } from "@/lib/categories-shared";

export { CATEGORY_MAX };

export const categoryKey = (name) => name.trim().toLowerCase();

// Checks a category name from a request body. Returns { name } or { error }.
export function parseCategoryName(body) {
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (!name) return { error: "Category name is required" };
  if (name.length > CATEGORY_MAX) return { error: `Category name must be ${CATEGORY_MAX} characters or fewer` };
  return { name };
}

// Makes sure a category exists for the store (used when a product is saved with a category name).
export async function ensureCategory(store, name) {
  const clean = typeof name === "string" ? name.trim() : "";
  if (!clean) return;
  await Category.updateOne(
    { storeId: store._id, nameKey: categoryKey(clean) },
    { $setOnInsert: { businessId: store.businessId, storeId: store._id, name: clean, nameKey: categoryKey(clean) } },
    { upsert: true }
  ).catch(() => {}); // a parallel request may have created it first; that is fine
}

// The store's categories with how many products use each, sorted by name.
// Categories that products already use but that were never created (typed in before this existed)
// are created here, so nobody has to re-enter them.
export async function getStoreCategories(store) {
  await connectDB();
  // Aggregations don't cast string ids the way find() does, and pages pass plain-string ids
  const storeObjectId = new mongoose.Types.ObjectId(String(store._id));

  const used = (await Product.distinct("category", { storeId: store._id })).filter((n) => typeof n === "string" && n.trim());
  const existing = await Category.find({ storeId: store._id }).lean();
  const have = new Set(existing.map((c) => c.nameKey));
  const seen = new Set();
  const missing = [];
  for (const name of used) {
    const key = categoryKey(name);
    if (have.has(key) || seen.has(key)) continue;
    seen.add(key);
    missing.push({ businessId: store.businessId, storeId: store._id, name: name.trim(), nameKey: key });
  }
  if (missing.length) await Category.insertMany(missing, { ordered: false }).catch(() => {});

  const [docs, counts] = await Promise.all([
    Category.find({ storeId: store._id }).collation({ locale: "en" }).sort({ name: 1 }).lean(),
    Product.aggregate([
      { $match: { storeId: storeObjectId, category: { $nin: ["", null] } } },
      { $group: { _id: { $toLower: "$category" }, count: { $sum: 1 } } },
    ]),
  ]);
  const countByKey = new Map(counts.map((c) => [c._id, c.count]));

  return docs.map((c) => ({ id: c._id.toString(), name: c.name, count: countByKey.get(c.nameKey) ?? 0 }));
}
