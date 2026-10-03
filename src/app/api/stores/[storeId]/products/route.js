import { NextResponse } from "next/server";
import Product from "@/models/Product";
import InventoryLog from "@/models/InventoryLog";
import { authorizeStore } from "@/lib/api-auth";
import { buildProductFilter, parseProductInput, serializeProduct } from "@/lib/products";

export async function GET(request, { params }) {
  const { storeId } = await params;
  const { user, store, error } = await authorizeStore(storeId);
  if (error) return error;

  const sp = new URL(request.url).searchParams;
  const filter = buildProductFilter(
    store,
    {
      category: sp.get("category"),
      status: sp.get("status"),
      search: sp.get("search"),
      low: sp.get("low") === "1",
    },
    // Cashiers feed the POS screen, which must never see inactive products.
    { onlyActive: user.role === "cashier" }
  );

  const products = await Product.find(filter).sort({ name: 1 }).collation({ locale: "en" }).lean();
  return NextResponse.json({
    products: products.map((p) => serializeProduct(p, store.lowStockThreshold)),
  });
}

export async function POST(request, { params }) {
  const { storeId } = await params;
  const { user, store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data, error: validationError, field } = parseProductInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError, field }, { status: 400 });
  }

  // New products always start active; the tenant comes from the verified store, never the body.
  const { isActive, ...fields } = data;
  const product = await Product.create({
    ...fields,
    businessId: store.businessId,
    storeId: store._id,
  });

  if (product.stock > 0) {
    await InventoryLog.create({
      storeId: store._id,
      productId: product._id,
      type: "restock",
      delta: product.stock,
      previousStock: 0,
      newStock: product.stock,
      performedBy: user.id,
      reason: "Initial stock",
    });
  }

  return NextResponse.json(
    { product: serializeProduct(product, store.lowStockThreshold) },
    { status: 201 }
  );
}
