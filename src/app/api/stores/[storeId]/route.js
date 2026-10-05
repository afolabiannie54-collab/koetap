import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireOwner, findOwnedStore } from "@/lib/api-auth";
import { destroyImages } from "@/lib/cloudinary";
import { deleteStoreData } from "@/lib/deletion";
import { parseStoreInput } from "@/lib/stores";

const notFound = () => NextResponse.json({ error: "Store not found" }, { status: 404 });

export async function GET(_request, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const { storeId } = await params;
  await connectDB();
  const store = await findOwnedStore(user, storeId);
  if (!store) return notFound();

  return NextResponse.json({ store });
}

export async function PATCH(request, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data, error: validationError } = parseStoreInput(body, { partial: true });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { storeId } = await params;
  await connectDB();
  const store = await findOwnedStore(user, storeId);
  if (!store) return notFound();

  const oldLogo = store.logoUrl;
  store.set(data);
  // Turning a store on or off by hand is the owner's decision, so a business suspension can no longer undo it.
  if (data.isActive !== undefined) store.suspendedByBusiness = undefined;
  await store.save();
  // A replaced or removed logo is no longer used by anything, so it goes from Cloudinary too.
  if (oldLogo && oldLogo !== store.logoUrl) await destroyImages([oldLogo]);
  return NextResponse.json({ store });
}

// Without ?permanent=true: the store and its history stay in the database, just switched off.
// With ?permanent=true: the store and everything in it (products, cashier accounts, stock history and sales) is
// deleted for good. The body must repeat the store's exact name, so it can't happen by accident.
export async function DELETE(request, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const { storeId } = await params;
  await connectDB();
  const store = await findOwnedStore(user, storeId);
  if (!store) return notFound();

  if (new URL(request.url).searchParams.get("permanent") === "true") {
    const body = await request.json().catch(() => ({}));
    if (body.confirmName !== store.name) {
      return NextResponse.json({ error: "Type the store's name exactly to confirm." }, { status: 400 });
    }
    const counts = await deleteStoreData(store, user);
    return NextResponse.json({ message: "Store deleted", counts });
  }

  store.isActive = false;
  store.suspendedByBusiness = undefined; // closed on purpose: a reinstatement must not reopen it
  await store.save();
  return NextResponse.json({ message: "Store deactivated", store });
}
