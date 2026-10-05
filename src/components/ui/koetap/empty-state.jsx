import { EmptyIcon } from "@/components/ui/koetap/empty-icon";
import { cn } from "@/lib/utils";

// Shown when a list or table has nothing in it: a big, bold picture, a clear heading, a sentence of help, and
// (usually) the button that fixes it.
//   size "sm": for an empty state inside a card or panel (smaller picture, less padding)
export function EmptyState({ icon, title, description, children, className, size = "lg" }) {
  const big = size === "lg";

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        big ? "gap-5 px-6 py-14" : "gap-3.5 px-6 py-8",
        className
      )}
    >
      {icon && <EmptyIcon icon={icon} size={size} />}
      <div className="space-y-1.5">
        <h2 className={cn("font-bold tracking-tight", big ? "text-2xl" : "text-lg")}>{title}</h2>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
