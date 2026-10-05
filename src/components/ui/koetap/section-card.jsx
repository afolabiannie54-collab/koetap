import { cn } from "@/lib/utils";

// A titled panel: the title and a one-line description sit on a tinted header strip, with an optional action
// (a link or button) on the right, and the content below. Use it for each distinct block on a page so the
// page reads as clear sections rather than one pile of cards.
export function SectionCard({ title, description, action, children, className, bodyClassName }) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
