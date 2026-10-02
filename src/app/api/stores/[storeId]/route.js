import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireOwner, findOwnedStore } from "@/lib/api-auth";
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

  store.set(data);
  await store.save();
  return NextResponse.json({ store });
}

// Soft delete: the store and its history stay in the database, just switched off.
export async function DELETE(_request, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const { storeId } = await params;
  await connectDB();
  const store = await findOwnedStore(user, storeId);
  if (!store) return notFound();

  store.isActive = false;
  await store.save();
  return NextResponse.json({ message: "Store deactivated", store });
}
