import { Skeleton } from "@/components/ui/skeleton";

// A shimmering placeholder. Give it the size of the thing it stands in for: <KSkeleton className="h-6 w-40" />
export function KSkeleton({ className, ...props }) {
  return <Skeleton className={className} {...props} />;
}
