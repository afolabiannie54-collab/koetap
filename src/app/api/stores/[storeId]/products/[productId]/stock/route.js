import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import InventoryLog from "@/models/InventoryLog";
import { authorizeStore } from "@/lib/api-auth";
import { ADJUSTMENT_TYPES, serializeProduct } from "@/lib/products";

const bad = (error, field) => NextResponse.json({ error, field }, { status: 400 });

export async function PATCH(request, { params }) {
  const { storeId, productId } = await params;
  const { user, store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;

  if (!mongoose.isValidObjectId(productId)) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body");
  }

  const { type } = body;
  if (!ADJUSTMENT_TYPES.includes(type)) {
    return bad("Type must be restock, correction or write-off", "type");
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
    return bad("Quantity must be a whole number greater than 0", "quantity");
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "";

  // Restock and correction add; write-off subtracts.
  const delta = type === "write-off" ? -quantity : quantity;

  // One atomic update (floored at 0), so two simultaneous adjustments can't overwrite each other.
  // new: false returns the previous document, which gives the exact "previous stock" for the log.
  // updatePipeline is required by Mongoose to accept the array form of an update.
  const product = await Product.findOneAndUpdate(
    { _id: productId, storeId: store._id },
    [{ $set: { stock: { $max: [0, { $add: [{ $ifNull: ["$stock", 0] }, delta] }] } } }],
    { new: false, updatePipeline: true }
  );
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const previousStock = product.stock ?? 0;
  const newStock = Math.max(0, previousStock + delta);
  const actualDelta = newStock - previousStock;

  if (actualDelta === 0) {
    return bad("Stock is already 0, so there is nothing to write off", "quantity");
  }

  await InventoryLog.create({
    storeId: store._id,
    productId: product._id,
    // The log's type enum has no separate correction/write-off, so both are "adjustment";
    // the sign of delta says which way it went.
    type: type === "restock" ? "restock" : "adjustment",
    delta: actualDelta,
    previousStock,
    newStock,
    performedBy: user.id,
    reason: reason || undefined,
  });

  product.stock = newStock;
  return NextResponse.json({ product: serializeProduct(product, store.lowStockThreshold) });
}
