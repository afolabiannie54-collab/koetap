import { NextResponse } from "next/server";
import Category from "@/models/Category";
import { authorizeStore } from "@/lib/api-auth";
import { categoryKey, getStoreCategories, parseCategoryName } from "@/lib/categories";

// The store's product categories. Owners manage them; cashiers can read the list.
export async function GET(_request, { params }) {
  const { storeId } = await params;
  const { store, error } = await authorizeStore(storeId);
  if (error) return error;

  return NextResponse.json({ categories: await getStoreCategories(store) });
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

  const { name, error: validationError } = parseCategoryName(body);
  if (validationError) return NextResponse.json({ error: validationError, field: "name" }, { status: 400 });

  const key = categoryKey(name);
  if (await Category.exists({ storeId: store._id, nameKey: key })) {
    return NextResponse.json({ error: `You already have a category called "${name}"`, field: "name" }, { status: 409 });
  }

  const created = await Category.create({ businessId: store.businessId, storeId: store._id, name, nameKey: key });
  return NextResponse.json({ category: { id: created._id.toString(), name: created.name, count: 0 } }, { status: 201 });
}
