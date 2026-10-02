import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import Store from "@/models/Store";

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
