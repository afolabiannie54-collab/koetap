import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/ui/koetap/page-skeletons";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </div>
  );
}
