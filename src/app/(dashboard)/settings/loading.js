import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/ui/koetap/page-skeletons";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <Card className="max-w-2xl gap-5">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2 px-(--card-spacing)">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </Card>
    </div>
  );
}
