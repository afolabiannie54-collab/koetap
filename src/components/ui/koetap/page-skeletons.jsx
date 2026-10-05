import { Skeleton } from "@/components/ui/skeleton";
import { StatGroup } from "@/components/ui/koetap/stat-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Loading placeholders for DATA only.
//
// The rule: anything that doesn't depend on the database (headings, descriptions, labels, column headers,
// buttons, tabs) is drawn for real while the page loads, and only the numbers, names and rows the database is
// still fetching show a skeleton. So a loading screen is the finished page with grey bars where the data goes,
// and nothing jumps or disappears when the data arrives.

// The stat strip with its real labels and skeleton values. labels: ["Today's revenue", "Sales today", ...]
export function StatsSkeleton({ labels, cols }) {
  return <StatGroup cols={cols} items={labels.map((label) => ({ label, loading: true }))} />;
}

// Rows like the store list / recent sales: a tile, two lines, and something on the right.
export function RowsSkeleton({ rows = 3, className }) {
  return (
    <div className={cn("divide-y divide-border", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// The store list as it looks while loading: its own bordered surface with skeleton rows.
export function StoreListSkeleton({ rows = 2 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <RowsSkeleton rows={rows} />
    </div>
  );
}

// A table with its real column headers and skeleton rows.
//   columns: [{ label, className, align }]  (className the same as on the real table, e.g. "hidden md:table-cell")
export function DataTableSkeleton({ columns, rows = 6 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.label} className={cn(c.align === "right" && "text-right", c.className)}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, r) => (
            <TableRow key={r} className="hover:bg-transparent">
              {columns.map((c, i) => (
                <TableCell key={c.label} className={cn(c.className)}>
                  <Skeleton className={cn("h-4", i === 0 ? "w-32" : "w-16", c.align === "right" && "ml-auto")} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
