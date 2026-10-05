import Link from "next/link";
import { ShoppingCart, Store as StoreIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { formatMoney, serializeStore } from "@/lib/stores";
import { getStoreCounts } from "@/lib/store-stats";
import { getOverview } from "@/lib/overview";
import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { Greeting } from "@/components/dashboard/greeting";
import { LowStockPanel } from "@/components/dashboard/low-stock-panel";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { StoreList } from "@/components/dashboard/store-list";
import { TopBarActions } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { StatGroup } from "@/components/ui/koetap/stat-group";

export const metadata = { title: "Dashboard | Koetap" };

export default async function DashboardPage() {
  const { user } = await auth();
  const filter = businessFilter(user);

  await connectDB();
  const storeDocs = await Store.find(filter).sort({ createdAt: -1 });
  const stores = storeDocs.map(serializeStore);
  const name = user.name?.split(" ")[0] || "there";

  if (stores.length === 0) {
    return (
      <div className="space-y-8">
        <Greeting name={name} />
        <EmptyState
          icon={StoreIcon}
          title="Create your first store"
          description="A store is your own POS: its products, its cashiers, its sales. Set one up and start selling."
        >
          <AddStoreDialog label="Create your first store" size="lg" />
        </EmptyState>
      </div>
    );
  }

  const [counts, overview] = await Promise.all([getStoreCounts(stores.map((s) => s.id)), getOverview(stores)]);
  const activeStores = stores.filter((s) => s.isActive);
  const cashiers = Object.values(counts).reduce((n, c) => n + c.cashiers, 0);
  const currency = stores[0].currency;
  const mixedCurrencies = new Set(stores.map((s) => s.currency)).size > 1;
  const onlyStore = stores.length === 1 ? stores[0] : null;
  const change = overview.revenueChange;

  const lowHref = (p) => `/stores/${p?.storeId ?? stores[0].id}/products?low=1`;

  return (
    <div className="animate-contentIn space-y-6">
      {/* Add Store sits in the top bar, top right */}
      <TopBarActions>
        <KTooltip label="Create another store with its own products, staff and sales" side="bottom" align="end">
          <AddStoreDialog variant="outline" />
        </KTooltip>
      </TopBarActions>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Greeting name={name} />
        {onlyStore?.isActive && (
          <KTooltip label="Start selling: opens the cash register for this store" align="end">
            <Button asChild size="lg">
              <Link href={`/pos/${onlyStore.id}`}>
                <ShoppingCart />
                Open POS
              </Link>
            </Button>
          </KTooltip>
        )}
      </div>

      <StatGroup
        aria-label="Today at a glance"
        items={[
          {
            label: "Today's revenue",
            value: formatMoney(overview.today.revenue, currency),
            note: change === null ? "Nothing to compare with yesterday" : `${change > 0 ? "+" : ""}${change}% vs yesterday`,
            noteTone: change === null ? undefined : change > 0 ? "text-success-ink" : change < 0 ? "text-error-ink" : undefined,
            help: `Money taken today across all your stores, counted from midnight UTC${mixedCurrencies ? ". Your stores use different currencies, so this adds them up as recorded" : ""}.`,
          },
          {
            label: "Sales today",
            value: overview.today.sales,
            note: `${overview.today.items} ${overview.today.items === 1 ? "item" : "items"} sold`,
            help: "How many sales were completed today. Each time a cashier presses Complete Sale counts as one.",
          },
          {
            label: "Low stock",
            value: <span className={overview.lowStockCount > 0 ? "text-warning-ink" : undefined}>{overview.lowStockCount}</span>,
            note: overview.lowStockCount > 0 ? "Tap to see what to restock" : "Everything is well stocked",
            href: overview.lowStockCount > 0 ? lowHref(overview.lowStock[0]) : undefined,
            help: "Products that have fallen to their low-stock level (or sold out). You set that level per store or per product.",
          },
          {
            label: "Active cashiers",
            value: cashiers,
            note: onlyStore ? "Manage staff" : `Across ${activeStores.length} ${activeStores.length === 1 ? "store" : "stores"}`,
            href: onlyStore ? `/stores/${onlyStore.id}/staff` : undefined,
            help: "People who can sign in to the POS right now. Deactivated cashiers aren't counted.",
          },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <RecentSales
          sales={overview.recentSales}
          currency={currency}
          showStore={stores.length > 1}
          reportsHref={onlyStore ? `/stores/${onlyStore.id}/reports` : "/reports"}
          openPosHref={onlyStore?.isActive ? `/pos/${onlyStore.id}` : undefined}
        />
        <LowStockPanel items={overview.lowStock} count={overview.lowStockCount} showStore={stores.length > 1} hrefFor={lowHref} />
      </div>

      <section aria-labelledby="your-stores" className="space-y-3 pt-2">
        <h2 id="your-stores" className="text-lg font-semibold tracking-tight">
          Your stores
        </h2>
        <StoreList stores={stores} counts={counts} />
      </section>
    </div>
  );
}
