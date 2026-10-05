import { Skeleton } from "@/components/ui/skeleton";
import { StatsSkeleton } from "@/components/ui/koetap/page-skeletons";
import { SectionCard } from "@/components/ui/koetap/section-card";
import { cn } from "@/lib/utils";

const PRESETS = ["Today", "This Week", "This Month", "Last Month", "Custom"];

// Reports as they load: the real date presets (inactive until the data is here), real stat labels, real panel
// title, and grey bars where the numbers and the chart go.
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1 shadow-(--field-shadow)">
          {PRESETS.map((label, i) => (
            <span
              key={label}
              className={cn(
                "inline-flex h-8 items-center rounded-lg px-3.5 text-sm font-medium",
                i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Dates and times are in UTC.</p>
      </div>

      <StatsSkeleton labels={["Total Revenue", "Total Transactions", "Average Order Value", "Items Sold"]} />

      <SectionCard title="Revenue" description="By day" bodyClassName="p-5">
        <Skeleton className="h-72 w-full" />
      </SectionCard>
    </div>
  );
}
