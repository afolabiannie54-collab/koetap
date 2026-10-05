import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// A row of numbers on ONE surface, split by hairlines, instead of a separate card for each number.
// Items: { label, value, note, noteTone, href, loading }. An item with an href is a link to somewhere useful.
// `cols` is how many columns to use on large screens (defaults to one per item, up to 4).
const LG_COLS = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };

function Item({ label, value, note, noteTone, href, loading }) {
  const body = loading ? (
    <>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-28" />
      <Skeleton className="mt-2 h-3 w-24" />
    </>
  ) : (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
      {note && <p className={cn("mt-1 text-xs font-medium", noteTone ?? "text-muted-foreground")}>{note}</p>}
    </>
  );

  const base = "block bg-card px-5 py-4";
  if (href && !loading) {
    return (
      <Link
        href={href}
        className={cn(base, "transition-colors duration-150 hover:bg-accent focus-visible:relative focus-visible:z-10")}
      >
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}

export function StatGroup({ items, cols, className, ...props }) {
  const lg = LG_COLS[cols ?? Math.min(Math.max(items.length, 2), 5)] ?? "lg:grid-cols-4";
  return (
    <div
      className={cn(
        // gap-px on a coloured background draws the dividers; every item paints over it with its own white.
        "grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-sm",
        "[&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1",
        lg,
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Item key={item.label} {...item} />
      ))}
    </div>
  );
}
