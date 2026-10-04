import { Store as StoreIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { serializeStore } from "@/lib/stores";
import { getStoreCounts } from "@/lib/store-stats";
import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { StoreCard } from "@/components/dashboard/store-card";
import { TopBarActions } from "@/components/dashboard/topbar";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { PageHeader } from "@/components/ui/koetap/page-header";

export const metadata = { title: "Stores | Koetap" };

export default async function StoresPage() {
  const { user } = await auth();

  await connectDB();
  const docs = await Store.find(businessFilter(user)).sort({ createdAt: -1 });
  const stores = docs.map(serializeStore);
  const counts = await getStoreCounts(stores.map((s) => s.id));

  return (
    <div className="space-y-8">
      {/* "Add Store" sits in the top bar, top right */}
      <TopBarActions>
        <AddStoreDialog />
      </TopBarActions>

      <PageHeader title="Your Stores" description="Each store is its own POS, with its own products, staff and sales." />

      {stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores yet"
          description="Create your first store to start adding products and making sales."
        >
          <AddStoreDialog label="Add your first store" size="lg" />
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} counts={counts[store.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
