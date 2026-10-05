import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { Greeting } from "@/components/dashboard/greeting";
import { TopBarActions } from "@/components/dashboard/topbar";
import { RowsSkeleton, StatsSkeleton, StoreListSkeleton } from "@/components/ui/koetap/page-skeletons";
import { SectionCard } from "@/components/ui/koetap/section-card";

// The dashboard as it loads: the real greeting, labels, panel titles and Add Store button, with grey bars only
// where the numbers and rows will go.
export default function Loading() {
  return (
    <div className="space-y-6">
      <TopBarActions>
        <AddStoreDialog variant="outline" />
      </TopBarActions>

      <Greeting />

      <StatsSkeleton labels={["Today's revenue", "Sales today", "Low stock", "Active cashiers"]} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SectionCard title="Recent sales" description="The latest sales across your stores">
          <RowsSkeleton rows={5} />
        </SectionCard>
        <SectionCard title="Running low" description="Restock these before they sell out">
          <RowsSkeleton rows={3} />
        </SectionCard>
      </div>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold tracking-tight">Your stores</h2>
        <StoreListSkeleton />
      </section>
    </div>
  );
}
