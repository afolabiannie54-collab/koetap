import { cn } from "@/lib/utils";

// The big icon at the top of an empty state: just the icon itself, large and heavy, with no filled tile or pill
// behind it. Black/white by default, the store's accent colour inside a store (via text-primary), green for "all good".
export function EmptyIcon({ icon: Icon, size = "lg", tone = "primary", className }) {
  const big = size === "lg";
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={2.25}
      className={cn("shrink-0", big ? "size-28" : "size-16", tone === "success" ? "text-success" : "text-primary", className)}
    />
  );
}
