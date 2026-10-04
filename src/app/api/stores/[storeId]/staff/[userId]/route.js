import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { authorizeStore } from "@/lib/api-auth";
import { parseStaffInput, serializeStaff } from "@/lib/staff";

const notFound = () => NextResponse.json({ error: "Staff member not found" }, { status: 404 });

// Only cashiers of this exact store and business are reachable, so another store's staff,
// owners and superadmins can't be touched through this route.
const staffQuery = (store, userId) => ({
  _id: userId,
  role: "cashier",
  storeId: store._id,
  businessId: store.businessId,
});

export async function GET(_request, { params }) {
  const { storeId, userId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;
  if (!mongoose.isValidObjectId(userId)) return notFound();

  const user = await User.findOne(staffQuery(store, userId)).select("-password");
  if (!user) return notFound();

  return NextResponse.json({ user: serializeStaff(user) });
}

export async function PATCH(request, { params }) {
  const { storeId, userId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;
  if (!mongoose.isValidObjectId(userId)) return notFound();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Only name, email, password and isActive come out of this. storeId (and role) can't be changed.
  const { data, error: validationError, field } = parseStaffInput(body, { partial: true });
  if (validationError) {
    return NextResponse.json({ error: validationError, field }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const user = await User.findOne(staffQuery(store, userId));
  if (!user) return notFound();

  if (data.email && data.email !== user.email) {
    const taken = await User.exists({ email: data.email, _id: { $ne: user._id } });
    if (taken) {
      return NextResponse.json(
        { error: "This email is already registered", field: "email" },
        { status: 400 }
      );
    }
  }

  if (data.password) data.password = await bcrypt.hash(data.password, 12);

  user.set(data);
  // Switching a cashier on or off by hand is the owner's decision, so a business suspension can no longer undo it.
  if (data.isActive !== undefined) user.suspendedByBusiness = undefined;
  try {
    await user.save();
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: "This email is already registered", field: "email" },
        { status: 400 }
      );
    }
    throw err;
  }

  return NextResponse.json({ user: serializeStaff(user) });
}

// Soft delete: the account and its sales history stay, it just can't sign in any more.
export async function DELETE(_request, { params }) {
  const { storeId, userId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;
  if (!mongoose.isValidObjectId(userId)) return notFound();

  const user = await User.findOneAndUpdate(
    staffQuery(store, userId),
    { $set: { isActive: false }, $unset: { suspendedByBusiness: "" } }, // let go on purpose: stays off
    { returnDocument: "after" }
  ).select("-password");
  if (!user) return notFound();

  return NextResponse.json({ message: "Staff member deactivated", user: serializeStaff(user) });
}
