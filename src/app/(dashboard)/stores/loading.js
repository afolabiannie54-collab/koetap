import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { TopBarActions } from "@/components/dashboard/topbar";
import { StoreListSkeleton } from "@/components/ui/koetap/page-skeletons";
import { PageHeader } from "@/components/ui/koetap/page-header";

export default function Loading() {
  return (
    <div className="space-y-8">
      <TopBarActions>
        <AddStoreDialog />
      </TopBarActions>

      <PageHeader title="Your Stores" description="Each store is its own POS, with its own products, staff and sales." />

      <StoreListSkeleton />
    </div>
  );
}
