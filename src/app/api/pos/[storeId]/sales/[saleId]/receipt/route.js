import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Resend } from "resend";
import Sale from "@/models/Sale";
import { authorizeStore } from "@/lib/api-auth";
import { buildReceiptEmail } from "@/lib/receipt-email";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request, { params }) {
  const { storeId, saleId } = await params;
  const { store, error } = await authorizeStore(storeId);
  if (error) return error;

  if (!mongoose.isValidObjectId(saleId)) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address", field: "email" }, { status: 400 });
  }

  // Looked up through the verified store, so a sale from another store can't be reached.
  const sale = await Sale.findOne({ _id: saleId, storeId: store._id });
  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("Receipt email: RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email receipts aren't set up yet" }, { status: 503 });
  }

  const { subject, html } = buildReceiptEmail({ store, sale });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM || "Koetap <onboarding@resend.dev>",
    to: email,
    subject,
    html,
  });

  if (sendError) {
    console.error("Receipt email failed:", sendError);
    return NextResponse.json({ error: "Could not send the receipt email" }, { status: 502 });
  }

  sale.receiptSent = true;
  await sale.save();
  return NextResponse.json({ message: "Receipt sent" });
}
