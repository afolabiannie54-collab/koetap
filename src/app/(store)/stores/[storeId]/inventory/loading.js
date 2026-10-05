import { DataTableSkeleton } from "@/components/ui/koetap/page-skeletons";

export default function Loading() {
  return (
    <DataTableSkeleton
      rows={8}
      columns={[
        { label: "Date" },
        { label: "Product" },
        { label: "Type" },
        { label: "Change", align: "right" },
        { label: "Previous Stock", align: "right" },
        { label: "New Stock", align: "right" },
        { label: "Performed By" },
        { label: "Reason" },
      ]}
    />
  );
}
