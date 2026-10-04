import { ChartSkeleton, PageHeaderSkeleton, StatsSkeleton } from "@/components/ui/koetap/page-skeletons";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatsSkeleton count={6} />
      <ChartSkeleton />
    </div>
  );
}
