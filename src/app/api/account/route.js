import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Business from "@/models/Business";
import { requireOwner } from "@/lib/api-auth";
import { forgetBusinessStatus } from "@/lib/business-status";
import { deleteBusinessData, deleteUserOnly } from "@/lib/deletion";

// An owner deleting their own account. That closes their whole business: every store, product, cashier, sale and
// image goes with it, for good. The body must repeat the business's exact name (or, before setup is finished, the
// account's email), so it can't happen by accident. The caller signs out afterwards.
export async function DELETE(request) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (user.role !== "owner") {
    return NextResponse.json({ error: "A super admin account can't be deleted here." }, { status: 403 });
  }

  await connectDB();
  const business = user.businessId ? await Business.findById(user.businessId) : null;
  const expected = business?.name ?? user.email;

  const body = await request.json().catch(() => ({}));
  if (body.confirmName !== expected) {
    return NextResponse.json({ error: `Type "${expected}" exactly to confirm.` }, { status: 400 });
  }

  const counts = business ? await deleteBusinessData(business, user, "account") : await deleteUserOnly(user, user);
  if (business) forgetBusinessStatus(business._id);
  return NextResponse.json({ message: "Account deleted", counts });
}
