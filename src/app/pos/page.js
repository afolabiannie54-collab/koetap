import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = { title: "POS | Koetap" };

export default async function PosIndexPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) redirect("/login");

  // Owners (and superadmins) pick a store from its page in the dashboard.
  if (user.role !== "cashier") redirect("/dashboard");

  if (user.storeId) redirect(`/pos/${user.storeId}`);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">No store assigned</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your account isn&apos;t assigned to a store yet. Please contact your store owner.
        </p>
      </div>
    </main>
  );
}
