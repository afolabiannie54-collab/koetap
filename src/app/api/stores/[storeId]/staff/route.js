import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { authorizeStore } from "@/lib/api-auth";
import { parseStaffInput, serializeStaff } from "@/lib/staff";

const EMAIL_TAKEN = { error: "This email is already registered", field: "email" };

// Staff management is for owners/superadmins only (write: true), cashiers can't list colleagues.
export async function GET(_request, { params }) {
  const { storeId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;

  const staff = await User.find({
    role: "cashier",
    storeId: store._id,
    businessId: store.businessId,
  })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ staff: staff.map(serializeStaff) });
}

export async function POST(request, { params }) {
  const { storeId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data, error: validationError, field } = parseStaffInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError, field }, { status: 400 });
  }

  // Emails are unique across the whole platform, not just this business.
  if (await User.exists({ email: data.email })) {
    return NextResponse.json(EMAIL_TAKEN, { status: 400 });
  }

  const hashed = await bcrypt.hash(data.password, 12);

  let user;
  try {
    // Role, business and store are fixed here: the store (and so the tenant) comes from the verified URL.
    user = await User.create({
      name: data.name,
      email: data.email,
      password: hashed,
      role: "cashier",
      businessId: store.businessId,
      storeId: store._id,
      setupComplete: true,
      isActive: true,
    });
  } catch (err) {
    // Two requests for the same email can both pass the check above; the unique index decides.
    if (err?.code === 11000) return NextResponse.json(EMAIL_TAKEN, { status: 400 });
    throw err;
  }

  return NextResponse.json({ user: serializeStaff(user) }, { status: 201 });
}
