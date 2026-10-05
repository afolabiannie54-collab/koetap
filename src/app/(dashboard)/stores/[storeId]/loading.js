import { Skeleton } from "@/components/ui/skeleton";
import { RowsSkeleton, StatsSkeleton } from "@/components/ui/koetap/page-skeletons";
import { SectionCard } from "@/components/ui/koetap/section-card";

// A store's overview as it loads: real labels and panel titles, grey bars where the data goes.
export default function Loading() {
  return (
    <div className="space-y-6">
      <StatsSkeleton labels={["Today's revenue", "Sales today", "Active products", "Low stock", "Active cashiers"]} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SectionCard title="Last 7 days" description="Revenue each day (UTC)" bodyClassName="p-5">
            <Skeleton className="h-56 w-full" />
          </SectionCard>
          <SectionCard title="Recent sales" description="The latest sales in this store">
            <RowsSkeleton rows={4} />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Running low" description="Restock these before they sell out">
            <RowsSkeleton rows={2} />
          </SectionCard>
          <SectionCard title="Quick actions" description="The things you'll do most">
            <div className="grid grid-cols-2 gap-3 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
