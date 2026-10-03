import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { findOwnedStore } from "@/lib/api-auth";
import { serializeStore } from "@/lib/stores";

// Loads the store for a page, once per request (the layout and the page share the result).
// Pages treat "not yours" the same as "doesn't exist".
export const getStorePageData = cache(async (storeId) => {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const doc = await findOwnedStore(session.user, storeId);
  if (!doc) notFound();

  return { user: session.user, store: serializeStore(doc) };
});
