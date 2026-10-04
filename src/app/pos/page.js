import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { auth } from "@/lib/auth";
import { EmptyState } from "@/components/ui/koetap/empty-state";

export const metadata = { title: "POS | Koetap" };

export default async function PosIndexPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) redirect("/login");

  // Owners (and superadmins) pick a store from its page in the dashboard.
  if (user.role !== "cashier") redirect("/dashboard");

  if (user.storeId) redirect(`/pos/${user.storeId}`);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <EmptyState
        icon={Store}
        title="No store assigned"
        description="Your account isn't assigned to a store yet. Please contact your store owner."
        className="max-w-md border-solid bg-card"
      />
    </main>
  );
}
