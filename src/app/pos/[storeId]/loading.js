import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-dvh flex-col bg-muted">
      <div className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="ml-auto h-8 w-40" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="hidden w-80 border-l border-border bg-card p-4 lg:block">
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}
