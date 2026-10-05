import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import InventoryLog from "@/models/InventoryLog";
import { authorizeStore } from "@/lib/api-auth";
import { ensureCategory } from "@/lib/categories";
import { parseProductInput, serializeProduct } from "@/lib/products";

const notFound = () => NextResponse.json({ error: "Product not found" }, { status: 404 });

// Products are always looked up through the verified store, so another store's product can't be reached.
const productQuery = (store, productId) => ({ _id: productId, storeId: store._id });

export async function GET(_request, { params }) {
  const { storeId, productId } = await params;
  const { user, store, error } = await authorizeStore(storeId);
  if (error) return error;
  if (!mongoose.isValidObjectId(productId)) return notFound();

  const product = await Product.findOne(productQuery(store, productId));
  // Inactive products are hidden from cashiers (POS).
  if (!product || (user.role === "cashier" && !product.isActive)) return notFound();

  return NextResponse.json({ product: serializeProduct(product, store.lowStockThreshold) });
}

export async function PATCH(request, { params }) {
  const { storeId, productId } = await params;
  const { user, store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;
  if (!mongoose.isValidObjectId(productId)) return notFound();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Only allowlisted fields come out of this; businessId/storeId in the body are ignored.
  const { data, error: validationError, field } = parseProductInput(body, { partial: true });
  if (validationError) {
    return NextResponse.json({ error: validationError, field }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  await ensureCategory(store, data.category);

  // returnDocument: "before" returns the document as it was, which gives us the previous stock for the log.
  const product = await Product.findOneAndUpdate(
    productQuery(store, productId),
    { $set: data },
    { returnDocument: "before" }
  );
  if (!product) return notFound();

  const previousStock = product.stock ?? 0;
  product.set(data);

  // Stock edited from the product form still leaves an audit trail.
  if (data.stock !== undefined && data.stock !== previousStock) {
    await InventoryLog.create({
      storeId: store._id,
      productId: product._id,
      type: "adjustment",
      delta: data.stock - previousStock,
      previousStock,
      newStock: data.stock,
      performedBy: user.id,
      reason: "Edited from product form",
    });
  }

  return NextResponse.json({ product: serializeProduct(product, store.lowStockThreshold) });
}

// Soft delete: the product and its history stay, it just stops being sold.
export async function DELETE(_request, { params }) {
  const { storeId, productId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;
  if (!mongoose.isValidObjectId(productId)) return notFound();

  const product = await Product.findOneAndUpdate(
    productQuery(store, productId),
    { $set: { isActive: false } },
    { returnDocument: "after" }
  );
  if (!product) return notFound();

  return NextResponse.json({
    message: "Product deactivated",
    product: serializeProduct(product, store.lowStockThreshold),
  });
}
