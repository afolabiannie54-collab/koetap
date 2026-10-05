import { StoreListSkeleton } from "@/components/ui/koetap/page-skeletons";
import { PageHeader } from "@/components/ui/koetap/page-header";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Choose a store to see its sales reports." />
      <StoreListSkeleton />
    </div>
  );
}
