import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { requireOwner, businessFilter } from "@/lib/api-auth";
import { parseStoreInput } from "@/lib/stores";

export async function GET() {
  const { user, error } = await requireOwner();
  if (error) return error;

  await connectDB();
  const stores = await Store.find(businessFilter(user)).sort({ createdAt: -1 });
  return NextResponse.json({ stores });
}

export async function POST(request) {
  const { user, error } = await requireOwner();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data, error: validationError } = parseStoreInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Superadmins have no business of their own, so they must say which one the store is for.
  const businessId = user.role === "superadmin" ? body.businessId : user.businessId;
  if (!mongoose.isValidObjectId(businessId)) {
    return NextResponse.json({ error: "A valid businessId is required" }, { status: 400 });
  }

  await connectDB();
  // isActive is not settable on create; new stores always start active.
  const { isActive, ...fields } = data;
  const store = await Store.create({ ...fields, businessId });
  return NextResponse.json({ store }, { status: 201 });
}
