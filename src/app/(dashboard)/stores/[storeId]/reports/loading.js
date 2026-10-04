import { ChartSkeleton, StatsSkeleton } from "@/components/ui/koetap/page-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <StatsSkeleton count={3} />
      <ChartSkeleton />
    </div>
  );
}
