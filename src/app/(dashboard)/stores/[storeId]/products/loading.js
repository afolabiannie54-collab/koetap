import { Plus, Search, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableSkeleton } from "@/components/ui/koetap/page-skeletons";

// The products tab as it loads: the real search box, filters and buttons (disabled until the data is here), the
// real column headers, and grey bars in the rows.
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input disabled placeholder="Search by name or SKU" aria-label="Search products" className="pl-10" />
        </div>
        <Select disabled>
          <SelectTrigger className="w-40" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
        </Select>
        <Select disabled>
          <SelectTrigger className="w-36" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
        </Select>
        <Button variant="secondary" disabled>
          Low stock only
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" disabled>
            <Tags />
            Categories
          </Button>
          <Button disabled>
            <Plus />
            Add Product
          </Button>
        </div>
      </div>

      <DataTableSkeleton
        columns={[
          { label: "Name" },
          { label: "Category", className: "hidden md:table-cell" },
          { label: "Price", align: "right" },
          { label: "Stock", align: "right" },
          { label: "Status", className: "hidden sm:table-cell" },
          { label: "Actions", align: "right" },
        ]}
      />
    </div>
  );
}
