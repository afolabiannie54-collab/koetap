import { cn } from "@/lib/utils";

// A small label that appears on hover or keyboard focus. Pure CSS, no library.
// The button inside should still carry an aria-label: this is a visual aid, not the accessible name.
export function KTooltip({ label, children, className }) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-md transition-opacity delay-150 duration-150 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
