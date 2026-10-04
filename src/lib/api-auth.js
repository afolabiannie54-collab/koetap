import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";

// A suspended business can't use the app, whatever session cookies it still holds.
const suspended = () =>
  NextResponse.json({ error: "Your account has been suspended. Contact support." }, { status: 403 });

// Resolves the signed-in owner/superadmin, or a ready-to-return error response.
export async function requireOwner() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "owner" && user.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (user.suspended) return { error: suspended() };
  if (user.role === "owner" && !user.businessId) {
    return { error: NextResponse.json({ error: "No business linked to this account" }, { status: 403 }) };
  }
  return { user };
}

// Owners only ever see their own business; superadmins see everything.
export function businessFilter(user) {
  return user.role === "superadmin" ? {} : { businessId: user.businessId };
}

// Returns the store only if it exists and belongs to the user's business.
export async function findOwnedStore(user, storeId) {
  if (!mongoose.isValidObjectId(storeId)) return null;
  return Store.findOne({ _id: storeId, ...businessFilter(user) });
}

// Session + store check for store-scoped API routes.
//   write: true  -> owner/superadmin only
//   write: false -> cashiers may also read, but only their own store
// 401 not signed in, 403 wrong role or another business's store, 404 no such store.
export async function authorizeStore(storeId, { write = false } = {}) {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const allowed = write ? ["owner", "superadmin"] : ["owner", "superadmin", "cashier"];
  if (!allowed.includes(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (user.suspended) return { error: suspended() };

  if (!mongoose.isValidObjectId(storeId)) {
    return { error: NextResponse.json({ error: "Store not found" }, { status: 404 }) };
  }

  await connectDB();
  const store = await Store.findById(storeId);
  if (!store) {
    return { error: NextResponse.json({ error: "Store not found" }, { status: 404 }) };
  }

  if (user.role !== "superadmin") {
    const wrongBusiness = String(store.businessId) !== user.businessId;
    const wrongStore = user.role === "cashier" && String(store._id) !== user.storeId;
    if (wrongBusiness || wrongStore) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  return { user, store };
}
