import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Business from "@/models/Business";
import Store from "@/models/Store";
import User from "@/models/User";
import { requireSuperadmin } from "@/lib/admin-api";
import { getBusinessDetail } from "@/lib/admin-data";
import { forgetBusinessStatus } from "@/lib/business-status";

const PLANS = ["free", "paid"];

const notFound = () => NextResponse.json({ error: "Business not found" }, { status: 404 });

class MissingBusiness extends Error {}

export async function GET(_request, { params }) {
  const { error } = await requireSuperadmin();
  if (error) return error;

  const { businessId } = await params;
  const detail = await getBusinessDetail(businessId);
  if (!detail) return notFound();

  return NextResponse.json(detail);
}

// Changes a business's status and/or plan. There's no payment handling: changing the plan just
// updates the field.
export async function PATCH(request, { params }) {
  const { error } = await requireSuperadmin();
  if (error) return error;

  const { businessId } = await params;
  if (!mongoose.isValidObjectId(businessId)) return notFound();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Only these two fields can be changed here, whatever else the body contains.
  const changes = {};
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be true or false" }, { status: 400 });
    }
    changes.isActive = body.isActive;
  }
  if (body.plan !== undefined) {
    if (!PLANS.includes(body.plan)) {
      return NextResponse.json({ error: "plan must be free or paid" }, { status: 400 });
    }
    changes.plan = body.plan;
  }
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  }

  await connectDB();
  const session = await mongoose.startSession();
  const cascade = { stores: 0, cashiers: 0 }; // switched off by a suspension
  const restored = { stores: 0, cashiers: 0 }; // switched back on by a reinstatement

  try {
    let business;

    // One transaction, so a business can never end up half-suspended.
    await session.withTransaction(async () => {
      cascade.stores = 0;
      cascade.cashiers = 0;
      restored.stores = 0;
      restored.cashiers = 0;

      business = await Business.findById(businessId).session(session);
      if (!business) throw new MissingBusiness();
      const wasSuspended = business.isActive === false;

      if (changes.plan) business.plan = changes.plan;
      if (changes.isActive !== undefined) business.isActive = changes.isActive;
      await business.save({ session });

      // Suspending switches off every store and cashier that is on, and marks each one it touched.
      // Anything already off (a cashier the owner let go, a store they closed) is left alone and
      // unmarked. Running it again changes nothing: the already-marked ones keep their mark.
      if (changes.isActive === false) {
        const stores = await Store.updateMany(
          { businessId, isActive: { $ne: false } },
          { $set: { isActive: false, suspendedByBusiness: true } },
          { session }
        );
        const cashiers = await User.updateMany(
          { businessId, role: "cashier", isActive: { $ne: false } },
          { $set: { isActive: false, suspendedByBusiness: true } },
          { session }
        );
        cascade.stores = stores.modifiedCount;
        cascade.cashiers = cashiers.modifiedCount;
      }

      // Reinstating switches back on exactly the ones the suspension turned off, and nothing else.
      if (changes.isActive === true && wasSuspended) {
        const stores = await Store.updateMany(
          { businessId, suspendedByBusiness: true },
          { $set: { isActive: true }, $unset: { suspendedByBusiness: "" } },
          { session }
        );
        const cashiers = await User.updateMany(
          { businessId, role: "cashier", suspendedByBusiness: true },
          { $set: { isActive: true }, $unset: { suspendedByBusiness: "" } },
          { session }
        );
        restored.stores = stores.modifiedCount;
        restored.cashiers = cashiers.modifiedCount;
      }
    });

    forgetBusinessStatus(businessId);

    return NextResponse.json({
      business: {
        _id: business._id.toString(),
        name: business.name,
        plan: business.plan ?? "free",
        isActive: business.isActive !== false,
      },
      cascade,
      restored,
    });
  } catch (err) {
    if (err instanceof MissingBusiness) return notFound();
    console.error("Admin business update failed:", err);
    return NextResponse.json({ error: "Could not update the business" }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
