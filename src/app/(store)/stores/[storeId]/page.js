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
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { LowStockBanner } from "@/components/store/low-stock-banner";
import { RecentSalesTable } from "@/components/store/recent-sales-table";
import { SectionCard } from "@/components/ui/koetap/section-card";
import { StatGroup } from "@/components/ui/koetap/stat-group";

// The store's home inside its own environment.
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
    getOverview([store], { recentLimit: 10 }),
  ]);

  const money = (n) => formatMoney(n, store.currency);
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

  const actions = [
    { href: `${base}/products`, icon: Package, label: "Add Product", hint: "Add something to sell" },
    { href: `${base}/staff`, icon: UserPlus, label: "Add Staff", hint: "Give a cashier a sign-in" },
    { href: `${base}/reports`, icon: BarChart3, label: "View Reports", hint: "Sales and best sellers" },
    { href: `/pos/${store.id}`, icon: ShoppingCart, label: "Open POS", hint: "Start selling now", accent: true },
  ];

  return (
    <div className="animate-contentIn space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight [overflow-wrap:anywhere]">{store.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {store.address ? `${store.address} · ` : ""}
          {store.currency}
        </p>
      </div>

      <SetupChecklist steps={steps} />

      <LowStockBanner storeId={store.id} count={overview.lowStockCount} href={`${base}/products?low=1`} />

      <StatGroup
        aria-label="Store totals"
        items={[
          {
            label: "Total Products",
            value: products,
            note: "Manage products",
            href: `${base}/products`,
            help: "Products customers can buy right now. Deactivated products are hidden from the POS and aren't counted.",
          },
          {
            label: "Total Sales",
            value: salesCount,
            note: `${overview.today.sales} today`,
            help: "Every sale this store has ever completed. Each Complete Sale counts as one.",
          },
          {
            label: "Total Revenue",
            value: money(lifetime[0]?.total ?? 0),
            note: `${money(overview.today.revenue)} today`,
            help: "All the money this store has taken, from every sale. Today's share is underneath (days are counted in UTC).",
          },
          {
            label: "Active Staff",
            value: cashiers,
            note: "Manage staff",
            href: `${base}/staff`,
            help: "Cashiers who can sign in to this store's POS. Deactivated cashiers aren't counted.",
          },
        ]}
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map(({ href, icon: Icon, label, hint, accent }) => (
          <Link
            key={label}
            href={href}
            style={accent ? { background: "var(--store-accent, var(--primary))", color: "var(--store-accent-fg, var(--primary-foreground))" } : undefined}
            className={
              "group/action flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] " +
              (accent ? "border-transparent" : "border-border bg-card hover:bg-accent")
            }
          >
            <span className={"flex size-10 shrink-0 items-center justify-center rounded-xl " + (accent ? "bg-white/20" : "bg-muted")}>
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{label}</span>
              <span className={"block truncate text-xs " + (accent ? "opacity-80" : "text-muted-foreground")}>{hint}</span>
            </span>
          </Link>
        ))}
      </div>

      <SectionCard title="Last 7 days" description="Revenue each day (UTC)" bodyClassName="p-5">
        <RevenueChart points={overview.week} interval="day" currency={store.currency} heightClass="h-56" />
      </SectionCard>

      <RecentSalesTable sales={overview.recentSales} currency={store.currency} reportsHref={`${base}/reports`} posHref={`/pos/${store.id}`} />
    </div>
  );
}
