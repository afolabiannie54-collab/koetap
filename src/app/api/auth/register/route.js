import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Business from "@/models/Business";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const businessName = body.businessName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!name || !businessName || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectDB();

    if (await User.findOne({ email })) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Business needs an ownerId and User needs a businessId, so pre-generate the user's _id.
    const userId = new User()._id;
    const business = await Business.create({ name: businessName, ownerId: userId, email });

    try {
      await User.create({
        _id: userId,
        name,
        email,
        password: hashed,
        role: "owner",
        businessId: business._id,
      });
    } catch (err) {
      await Business.deleteOne({ _id: business._id });
      throw err;
    }

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
