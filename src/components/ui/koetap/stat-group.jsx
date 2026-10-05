import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { InfoTip } from "@/components/ui/koetap/info-tip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// A row of numbers on ONE surface, split by hairlines, instead of a separate card for each number.
// Items: { label, value, note, noteTone, href, help, loading }.
//   help    a plain-language explanation, shown from a small (i) beside the label
//   href    makes the whole item a link to somewhere useful (with a chevron to say so)
//   loading only the value is a skeleton: the label, help and link are real and stay put
// `cols` is how many columns to use on large screens (defaults to one per item, up to 5).
const LG_COLS = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };

function Item({ label, value, note, noteTone, href, help, loading }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {label}
          {/* above the link overlay, so it can be hovered and clicked on its own */}
          {help && (
            <span className="pointer-events-auto relative z-10">
              <InfoTip label={`About ${label}`}>{help}</InfoTip>
            </span>
          )}
        </span>
        {href && <ChevronRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover/stat:translate-x-0.5 group-hover/stat:text-foreground" />}
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-2.5 h-8 w-28" />
          <Skeleton className="mt-2 h-3 w-24" />
        </>
      ) : (
        <>
          <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
          {note && <p className={cn("mt-1 text-xs font-medium", noteTone ?? "text-muted-foreground")}>{note}</p>}
        </>
      )}
    </>
  );

  const base = "group/stat relative block bg-card px-5 py-4";
  if (href) {
    // The whole item is clickable through an overlay link, so the (i) button inside stays a separate control
    return (
      <div className={cn(base, "transition-colors duration-150 hover:bg-accent")}>
        <Link href={href} aria-label={label} className="absolute inset-0 z-0 outline-offset-[-2px]" />
        <div className="pointer-events-none relative">{body}</div>
      </div>
    );
  }
  return <div className={base}>{body}</div>;
}

export function StatGroup({ items, cols, className, ...props }) {
  const lg = LG_COLS[cols ?? Math.min(Math.max(items.length, 2), 5)] ?? "lg:grid-cols-4";
  return (
    <div
      className={cn(
        // gap-px on a coloured background draws the dividers; every item paints over it with its own surface.
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
