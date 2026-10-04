import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card className="max-w-2xl gap-5">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2 px-(--card-spacing)">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </Card>
  );
}
