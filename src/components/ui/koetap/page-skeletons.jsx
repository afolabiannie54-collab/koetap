import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatGroup } from "@/components/ui/koetap/stat-group";

// Loading placeholders shaped like the pages they stand in for, so the layout doesn't jump when data arrives.

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

export function StatsSkeleton({ count = 3 }) {
  return <StatGroup items={Array.from({ length: count }, (_, i) => ({ label: String(i), loading: true }))} />;
}

// A few rows like the store list
export function CardGridSkeleton({ count = 3 }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {Array.from({ length: Math.min(count, 4) }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, bar = true }) {
  return (
    <div className="space-y-4">
      {bar && (
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Skeleton className="h-11 rounded-none" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-border px-4 py-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="gap-4">
      <div className="space-y-2 px-(--card-spacing)">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="px-(--card-spacing)">
        <Skeleton className="h-64 w-full" />
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatsSkeleton />
      <Skeleton className="h-6 w-32" />
      <CardGridSkeleton />
    </div>
  );
}
