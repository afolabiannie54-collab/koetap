import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableSkeleton } from "@/components/ui/koetap/page-skeletons";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button disabled>
          <Plus />
          Add Cashier
        </Button>
      </div>
      <DataTableSkeleton
        rows={3}
        columns={[
          { label: "Name" },
          { label: "Email", className: "hidden md:table-cell" },
          { label: "Status" },
          { label: "Date Added", className: "hidden sm:table-cell" },
          { label: "Actions", align: "right" },
        ]}
      />
    </div>
  );
}
