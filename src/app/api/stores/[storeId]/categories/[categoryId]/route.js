import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { authorizeStore } from "@/lib/api-auth";
import { categoryKey, parseCategoryName } from "@/lib/categories";

const notFound = () => NextResponse.json({ error: "Category not found" }, { status: 404 });

// Categories are always looked up through the verified store, so another store's category can't be reached.
const categoryQuery = (store, categoryId) => ({ _id: categoryId, storeId: store._id });

// Rename. Products using the old name are moved to the new one, so nothing is left behind.
export async function PATCH(request, { params }) {
  const { storeId, categoryId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;
  if (!mongoose.isValidObjectId(categoryId)) return notFound();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, error: validationError } = parseCategoryName(body);
  if (validationError) return NextResponse.json({ error: validationError, field: "name" }, { status: 400 });

  const category = await Category.findOne(categoryQuery(store, categoryId));
  if (!category) return notFound();

  const key = categoryKey(name);
  // Renaming "drinks" to "Drinks" is allowed (same key, it is the same category); a clash with a different one is not.
  if (key !== category.nameKey && (await Category.exists({ storeId: store._id, nameKey: key }))) {
    return NextResponse.json({ error: `You already have a category called "${name}"`, field: "name" }, { status: 409 });
  }

  const previous = category.name;
  category.name = name;
  category.nameKey = key;
  await category.save();

  // Products store the category by name; match without caring about case, as the list does.
  const moved = await Product.updateMany(
    { storeId: store._id, category: { $regex: `^${previous.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
    { $set: { category: name } }
  );

  return NextResponse.json({ category: { id: category._id.toString(), name }, productsUpdated: moved.modifiedCount });
}

// Delete. Products in it are kept and simply become uncategorised.
export async function DELETE(_request, { params }) {
  const { storeId, categoryId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return error;
  if (!mongoose.isValidObjectId(categoryId)) return notFound();

  const category = await Category.findOneAndDelete(categoryQuery(store, categoryId));
  if (!category) return notFound();

  const cleared = await Product.updateMany(
    { storeId: store._id, category: { $regex: `^${category.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
    { $set: { category: "" } }
  );

  return NextResponse.json({ ok: true, productsUncategorised: cleared.modifiedCount });
}
