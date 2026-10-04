import { Package, Receipt, Store as StoreIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import { businessFilter } from "@/lib/api-auth";
import { serializeStore } from "@/lib/stores";
import { getStoreCounts } from "@/lib/store-stats";
import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { Greeting } from "@/components/dashboard/greeting";
import { StoreCard } from "@/components/dashboard/store-card";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { StatCard } from "@/components/ui/koetap/stat-card";

export const metadata = { title: "Dashboard | Koetap" };

export default async function DashboardPage() {
  const { user } = await auth();
  const filter = businessFilter(user);

  await connectDB();
  const [storeDocs, products, sales] = await Promise.all([
    Store.find(filter).sort({ createdAt: -1 }),
    Product.countDocuments({ ...filter, isActive: true }),
    Sale.countDocuments(filter),
  ]);
  const stores = storeDocs.map(serializeStore);
  const counts = await getStoreCounts(stores.map((s) => s.id));
  const activeStores = stores.filter((s) => s.isActive).length;

  return (
    <div className="space-y-10">
      <Greeting name={user.name?.split(" ")[0] || "there"} />

      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={StoreIcon} label="Total Stores" value={activeStores} />
        <StatCard icon={Package} label="Total Products" value={products} />
        <StatCard icon={Receipt} label="Total Sales" value={sales} />
      </section>

      <section aria-labelledby="your-stores" className="space-y-4">
        <h2 id="your-stores" className="text-xl font-semibold tracking-tight">
          Your Stores
        </h2>

        {stores.length === 0 ? (
          <EmptyState
            icon={StoreIcon}
            title="Create your first store"
            description="A store is your own POS: its products, its cashiers, its sales. Set one up and start selling."
          >
            <AddStoreDialog label="Create your first store" size="lg" />
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} counts={counts[store.id]} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
