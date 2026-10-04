import { cn } from "@/lib/utils";

// Shown when a list or table has nothing in it: a simple line icon, a clear heading, a sentence of
// help, and (usually) the button that fixes it.
export function EmptyState({ icon: Icon, title, description, children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-input px-6 py-14 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-7" strokeWidth={1.5} />
        </div>
      )}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
