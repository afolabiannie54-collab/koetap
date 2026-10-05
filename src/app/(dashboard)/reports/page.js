import { redirect } from "next/navigation";
import { Store as StoreIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { serializeStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StoreList } from "@/components/dashboard/store-list";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { PageHeader } from "@/components/ui/koetap/page-header";

export const metadata = { title: "Reports | Koetap" };

// Reports are per store. This page just gets you to the right one.
export default async function ReportsIndexPage() {
  const { user } = await auth();

  await connectDB();
  const docs = await Store.find(businessFilter(user)).sort({ createdAt: -1 });
  const stores = docs.map(serializeStore);

  // One store: nothing to choose, go straight to its reports.
  if (stores.length === 1) redirect(`/stores/${stores[0].id}/reports`);

  // Active stores first; inactive ones keep their history, so they stay reachable.
  const ordered = [...stores.filter((s) => s.isActive), ...stores.filter((s) => !s.isActive)];

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Choose a store to see its sales reports." />

      {stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores yet"
          description="Reports are built from a store's sales. Create a store first."
        >
          <Button asChild size="lg">
            <Link href="/stores">Go to stores</Link>
          </Button>
        </EmptyState>
      ) : (
        <StoreList stores={ordered} hrefFor={(store) => `/stores/${store.id}/reports`} hint="View reports" />
      )}
    </div>
  );
}
