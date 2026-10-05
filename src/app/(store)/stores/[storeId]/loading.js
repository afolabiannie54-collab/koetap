import { BarChart3, Package, ShoppingCart, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton, StatsSkeleton } from "@/components/ui/koetap/page-skeletons";
import { SectionCard } from "@/components/ui/koetap/section-card";

const ACTIONS = [
  { icon: Package, label: "Add Product", hint: "Add something to sell" },
  { icon: UserPlus, label: "Add Staff", hint: "Give a cashier a sign-in" },
  { icon: BarChart3, label: "View Reports", hint: "Sales and best sellers" },
  { icon: ShoppingCart, label: "Open POS", hint: "Start selling now" },
];

// The store overview as it loads: the real labels, quick-action names and panel titles, with grey bars only
// where the store's own name, numbers and sales will go.
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>

      <StatsSkeleton labels={["Total Products", "Total Sales", "Total Revenue", "Active Staff"]} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ACTIONS.map(({ icon: Icon, label, hint }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">{hint}</span>
            </span>
          </div>
        ))}
      </div>

      <SectionCard title="Last 7 days" description="Revenue each day (UTC)" bodyClassName="p-5">
        <Skeleton className="h-56 w-full" />
      </SectionCard>

      <section>
        <h2 className="sr-only">Recent sales</h2>
        <DataTableSkeleton
          rows={5}
          columns={[
            { label: "Time" },
            { label: "Cashier", className: "hidden sm:table-cell" },
            { label: "Items", align: "right" },
            { label: "Total", align: "right" },
            { label: "Payment" },
          ]}
        />
      </section>
    </div>
  );
}
