import mongoose from "mongoose";
import Product from "@/models/Product";
import User from "@/models/User";

// Active products and active cashiers for a set of stores, in two grouped queries (not one per store).
// Returns { [storeId]: { products, cashiers } }, with zeros for stores that have none.
export async function getStoreCounts(storeIds) {
  const counts = Object.fromEntries(storeIds.map((id) => [id, { products: 0, cashiers: 0 }]));
  if (storeIds.length === 0) return counts;

  const ids = storeIds.map((id) => new mongoose.Types.ObjectId(id));
  const [products, cashiers] = await Promise.all([
    Product.aggregate([
      { $match: { storeId: { $in: ids }, isActive: { $ne: false } } },
      { $group: { _id: "$storeId", n: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { storeId: { $in: ids }, role: "cashier", isActive: true } },
      { $group: { _id: "$storeId", n: { $sum: 1 } } },
    ]),
  ]);

  for (const row of products) counts[row._id.toString()].products = row.n;
  for (const row of cashiers) counts[row._id.toString()].cashiers = row.n;
  return counts;
}
