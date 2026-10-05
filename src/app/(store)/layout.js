import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// The store environment: a store's own space, outside the Koetap dashboard shell. This layout is only the second
// lock (the proxy already keeps cashiers and signed-out visitors out); the store's own frame is in
// stores/[storeId]/layout.js, where the store's id is known.
export default async function StoreGroupLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "cashier") redirect("/pos");
  return children;
}
