import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { name, email } = session.user;

  // An owner with exactly one store has no list of stores to choose from, so the sidebar's "Stores" and
  // "Reports" links go straight to that store instead of through a redirecting page (which would flash a
  // loading screen for a page they never see).
  let singleStoreId = null;
  if (session.user.role === "owner") {
    await connectDB();
    const stores = await Store.find(businessFilter(session.user)).select("_id").limit(2).lean();
    if (stores.length === 1) singleStoreId = String(stores[0]._id);
  }

  return (
    <DashboardShell user={{ name, email }} singleStoreId={singleStoreId}>
      {children}
    </DashboardShell>
  );
}
