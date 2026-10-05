import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/koetap/page-header";
import { RowsSkeleton, StatsSkeleton } from "@/components/ui/koetap/page-skeletons";
import { SectionCard } from "@/components/ui/koetap/section-card";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader title="Platform overview" description="Everything across every business on Koetap." />

      <StatsSkeleton
        cols={3}
        labels={["Total Businesses", "Total Stores", "Total Sales", "Total Revenue", "New Businesses This Month", "Active Cashiers"]}
      />

      <SectionCard title="New business signups" description="Per day, last 30 days" bodyClassName="p-5">
        <Skeleton className="h-64 w-full" />
      </SectionCard>

      <SectionCard title="Recent activity" description="The 10 most recent sales across the platform">
        <RowsSkeleton rows={5} />
      </SectionCard>
    </div>
  );
}
