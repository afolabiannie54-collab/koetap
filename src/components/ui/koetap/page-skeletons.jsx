import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="gap-4">
          <div className="flex items-center justify-between px-(--card-spacing)">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-9" />
          </div>
          <div className="space-y-2 px-(--card-spacing)">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="gap-4">
          <div className="space-y-2 px-(--card-spacing)">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2 px-(--card-spacing)">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="px-(--card-spacing)">
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
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
