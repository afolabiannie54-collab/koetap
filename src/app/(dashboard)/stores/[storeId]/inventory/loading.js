import { TableSkeleton } from "@/components/ui/koetap/page-skeletons";

export default function Loading() {
  return <TableSkeleton bar={false} rows={8} />;
}
