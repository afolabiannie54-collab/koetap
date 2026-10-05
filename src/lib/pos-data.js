import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { findOwnedStore } from "@/lib/api-auth";
import { serializeStore } from "@/lib/stores";

// What the POS needs to know about a product, and nothing more (no cost price, no thresholds).
export async function loadPosProducts(storeObjectId) {
  const products = await Product.find({ storeId: storeObjectId, isActive: true })
    .select("name price stock category sku imageUrl")
    .sort({ name: 1 })
    .collation({ locale: "en" })
    .lean();

  return products.map((p) => ({
    _id: p._id.toString(),
    name: p.name,
    price: p.price,
    stock: p.stock ?? 0,
    category: p.category ?? "",
    sku: p.sku ?? "",
    imageUrl: p.imageUrl ?? "",
  }));
}

// Access check for the POS page itself. Cashiers may only open their own store; owners any store
// of their business. Anyone else is sent away (a cashier is sent to their own POS).
export async function getPosAccess(storeId) {
  const session = await auth();
  const user = session?.user;
  if (!user) redirect("/login");

  if (user.role === "cashier") {
    if (user.storeId !== storeId) redirect("/pos");
  } else if (user.role !== "owner" && user.role !== "superadmin") {
    redirect("/login");
  }

  await connectDB();
  const doc = await findOwnedStore(user, storeId);
  if (!doc) notFound();

  return { user, store: serializeStore(doc) };
}
