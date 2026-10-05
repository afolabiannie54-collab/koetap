import { NextResponse } from "next/server";
import { auth, unstable_update } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Business from "@/models/Business";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
  if (!businessName) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "superadmin") {
    return NextResponse.json({ error: "A super admin account doesn't have a business to set up" }, { status: 409 });
  }

  // Only Google sign-ups who haven't named a business yet. Email/password users already did at registration.
  const alreadySetUp = user.setupComplete ?? Boolean(user.businessId);
  if (alreadySetUp || user.businessId) {
    return NextResponse.json({ error: "Setup already completed" }, { status: 409 });
  }

  const business = await Business.create({
    name: businessName,
    ownerId: user._id,
    email: user.email,
  });

  // Guarded update so a double submit can't attach two businesses to the same user.
  const result = await User.updateOne(
    { _id: user._id, businessId: null, setupComplete: { $ne: true } },
    { businessId: business._id, setupComplete: true }
  );
  if (result.modifiedCount === 0) {
    await Business.deleteOne({ _id: business._id });
    return NextResponse.json({ error: "Setup already completed" }, { status: 409 });
  }

  // Refresh the JWT so the proxy stops redirecting to /setup and the session carries the businessId.
  await unstable_update({ user: { setupComplete: true } });

  return NextResponse.json({ message: "Setup complete" }, { status: 201 });
}
