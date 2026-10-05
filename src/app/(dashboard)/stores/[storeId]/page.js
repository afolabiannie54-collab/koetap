import mongoose from "mongoose";
import Link from "next/link";
import { BarChart3, Package, ShoppingCart, UserPlus } from "lucide-react";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import User from "@/models/User";
import { getStorePageData } from "@/lib/store-page";
import { getOverview } from "@/lib/overview";
import { formatMoney } from "@/lib/stores";
import { LowStockPanel } from "@/components/dashboard/low-stock-panel";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/koetap/section-card";
import { StatGroup } from "@/components/ui/koetap/stat-group";

export default async function StoreOverviewPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  await connectDB();
  const id = new mongoose.Types.ObjectId(store.id);
  const [products, salesCount, lifetime, cashiers, overview] = await Promise.all([
    Product.countDocuments({ storeId: id, isActive: true }),
    Sale.countDocuments({ storeId: id }),
    Sale.aggregate([{ $match: { storeId: id } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    User.countDocuments({ role: "cashier", storeId: id, businessId: store.businessId, isActive: true }),
    getOverview([store]),
  ]);

  const money = (n) => formatMoney(n, store.currency);
  const change = overview.revenueChange;
  const base = `/stores/${store.id}`;

  const steps = [
    { label: "Add your products", description: "Add what you sell, with its price and stock.", done: products > 0, href: `${base}/products`, cta: "Add products" },
    { label: "Add a cashier", description: "Give each person who sells their own sign-in.", done: cashiers > 0, href: `${base}/staff`, cta: "Add a cashier" },
    {
      label: "Make it yours",
      description: "Pick an accent colour and a receipt message for your POS.",
      done: Boolean(store.accentColor || store.receiptFooter || store.logoUrl),
      href: `${base}/settings`,
      cta: "Open settings",
    },
    { label: "Make your first sale", description: "Open the POS and ring up a sale to try it out.", done: salesCount > 0, href: `/pos/${store.id}`, cta: "Open the POS" },
  ];

  return (
    <div className="animate-contentIn space-y-6">
      <SetupChecklist steps={steps} />

      <StatGroup
        aria-label="Store at a glance"
        items={[
          {
            label: "Today's revenue",
            value: money(overview.today.revenue),
            note: change === null ? `${money(lifetime[0]?.total ?? 0)} all time` : `${change > 0 ? "+" : ""}${change}% vs yesterday`,
            noteTone: change === null ? undefined : change > 0 ? "text-success-ink" : change < 0 ? "text-error-ink" : undefined,
            help: "Money taken in this store today, counted from midnight UTC, compared with yesterday.",
          },
          {
            label: "Sales today",
            value: overview.today.sales,
            note: `${overview.today.items} ${overview.today.items === 1 ? "item" : "items"} sold`,
            help: "How many sales were completed today. Each Complete Sale counts as one.",
          },
          {
            label: "Active products",
            value: products,
            note: "Manage products",
            href: `${base}/products`,
            help: "Products customers can buy right now. Deactivated products are hidden from the POS and aren't counted.",
          },
          {
            label: "Low stock",
            value: <span className={overview.lowStockCount > 0 ? "text-warning-ink" : undefined}>{overview.lowStockCount}</span>,
            note: overview.lowStockCount > 0 ? "View items running low" : "Everything is well stocked",
            href: `${base}/products?low=1`,
            help: `Products at or below their low-stock level (this store's default is ${store.lowStockThreshold}), including anything sold out.`,
          },
          {
            label: "Active cashiers",
            value: cashiers,
            note: "Manage staff",
            href: `${base}/staff`,
            help: "People who can sign in to this store's POS. Deactivated cashiers aren't counted.",
          },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SectionCard title="Last 7 days" description="Revenue each day (UTC)" bodyClassName="p-5">
            <RevenueChart points={overview.week} interval="day" currency={store.currency} heightClass="h-56" />
          </SectionCard>
          <RecentSales sales={overview.recentSales} currency={store.currency} reportsHref={`${base}/reports`} openPosHref={`/pos/${store.id}`} />
        </div>

        <div className="space-y-6">
          <LowStockPanel items={overview.lowStock} count={overview.lowStockCount} hrefFor={() => `${base}/products?low=1`} />

          <SectionCard title="Quick actions" description="The things you'll do most">
            <div className="grid grid-cols-2 gap-3 p-4">
              {[
                { href: `/pos/${store.id}`, icon: ShoppingCart, label: "Open POS" },
                { href: `${base}/products`, icon: Package, label: "Add a product" },
                { href: `${base}/staff`, icon: UserPlus, label: "Add a cashier" },
                { href: `${base}/reports`, icon: BarChart3, label: "View reports" },
              ].map(({ href, icon: Icon, label }) => (
                <Button
                  key={label}
                  asChild
                  variant="ghost"
                  className="h-auto flex-col gap-2 rounded-xl border border-border bg-card py-4 shadow-(--raised-shadow) hover:bg-accent"
                >
                  <Link href={href}>
                    <Icon className="size-5" />
                    {label}
                  </Link>
                </Button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
