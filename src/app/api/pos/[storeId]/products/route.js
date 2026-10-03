import { NextResponse } from "next/server";
import { authorizeStore } from "@/lib/api-auth";
import { loadPosProducts } from "@/lib/pos-data";

// Owners (their own business's stores) and cashiers (their own store) may read; inactive products
// are never returned, so they can't appear on the POS.
export async function GET(_request, { params }) {
  const { storeId } = await params;
  const { store, error } = await authorizeStore(storeId);
  if (error) return error;

  const products = await loadPosProducts(store._id);
  return NextResponse.json({ products });
}
