import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import DeletionLog from "@/models/DeletionLog";
import InventoryLog from "@/models/InventoryLog";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import Store from "@/models/Store";
import User from "@/models/User";
import { destroyFolder, destroyImages } from "@/lib/cloudinary";

// Permanent deletion. These really remove the data (nothing is just switched off), in dependency order, and then
// write one small DeletionLog entry. Callers must already have checked who is allowed to do this and that the
// person confirmed it.
//
//   actor: { id, email }  the signed-in person doing it

async function log(entry, actor) {
  await DeletionLog.create({ ...entry, performedBy: actor?.id, performedByEmail: actor?.email });
}

// A store and everything in it: its products, categories, stock history, cashier accounts and sales.
export async function deleteStoreData(store, actor) {
  await connectDB();
  const storeId = store._id;
  const products = await Product.find({ storeId }).select("imageUrl").lean();
  const counts = {
    products: products.length,
    cashiers: await User.countDocuments({ role: "cashier", storeId }),
    sales: await Sale.countDocuments({ storeId }),
  };

  await Sale.deleteMany({ storeId });
  await InventoryLog.deleteMany({ storeId });
  await Category.deleteMany({ storeId });
  await Product.deleteMany({ storeId });
  await User.deleteMany({ role: "cashier", storeId });
  await Store.deleteOne({ _id: storeId });

  await destroyImages([store.logoUrl, ...products.map((p) => p.imageUrl)]);
  await log({ kind: "store", name: store.name, businessId: store.businessId, storeId, counts }, actor);
  return counts;
}

// A whole business: the owner and every cashier, all its stores with everything in them, its sales, and its images.
// kind "account" is the owner deleting their own account; "business" is the super admin deleting it.
export async function deleteBusinessData(business, actor, kind = "business") {
  await connectDB();
  const businessId = business._id;

  const stores = await Store.find({ businessId }).select("_id").lean();
  const storeIds = stores.map((s) => s._id);
  const users = await User.find({ $or: [{ businessId }, { _id: business.ownerId }] }).select("_id role").lean();
  // Never a super admin, whatever the data says
  const userIds = users.filter((u) => u.role !== "superadmin").map((u) => u._id);

  const counts = {
    stores: stores.length,
    users: userIds.length,
    products: await Product.countDocuments({ businessId }),
    sales: await Sale.countDocuments({ businessId }),
  };

  await Sale.deleteMany({ businessId });
  await InventoryLog.deleteMany({ storeId: { $in: storeIds } });
  await Category.deleteMany({ businessId });
  await Product.deleteMany({ businessId });
  await Store.deleteMany({ businessId });
  await User.deleteMany({ _id: { $in: userIds } });
  // Sign-in links (Google) that belong to those users
  await mongoose.connection.db.collection("accounts").deleteMany({ userId: { $in: userIds } });
  await Business.deleteOne({ _id: businessId });

  await destroyFolder(`koetap/${businessId}`);
  await log({ kind, name: business.name, businessId, counts }, actor);
  return counts;
}

// An owner who never finished setup has a user but no business yet.
export async function deleteUserOnly(user, actor) {
  await connectDB();
  await User.deleteOne({ _id: user.id });
  await mongoose.connection.db.collection("accounts").deleteMany({ userId: new mongoose.Types.ObjectId(user.id) });
  await log({ kind: "account", name: user.email, counts: { users: 1 } }, actor);
  return { users: 1 };
}
