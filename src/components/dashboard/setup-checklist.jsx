import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// "Get your store ready": the few things a new store needs before it can sell, with the next one highlighted
// and a button that goes straight to where it is done. Shown until every step is done, then it disappears.
// steps: [{ label, description, done, href, cta }]
export function SetupChecklist({ steps }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  const nextIndex = steps.findIndex((s) => !s.done);

  return (
    <section className="overflow-hidden rounded-2xl bg-foreground text-background shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Get your store ready</h2>
          <p className="mt-0.5 text-sm text-background/70">Finish these steps and you can start selling.</p>
        </div>
        <span className="rounded-full bg-background/15 px-3 py-1 text-xs font-semibold">
          {done} of {steps.length} done
        </span>
      </div>

      <div className="mx-5 mt-4 h-1.5 overflow-hidden rounded-full bg-background/20">
        <div
          className="h-full rounded-full bg-background transition-[width] duration-500 ease-out"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-3 divide-y divide-background/15 pb-2">
        {steps.map((s, i) => {
          const isNext = i === nextIndex;
          return (
            <li key={s.label} className={cn("flex items-center gap-3.5 px-5 py-3.5", isNext && "bg-background/10")}>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  s.done ? "bg-background text-foreground" : "border border-background/40 text-background/70"
                )}
              >
                {s.done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", s.done && "text-background/60 line-through decoration-background/40")}>
                  {s.label}
                </p>
                {!s.done && <p className="text-xs text-background/70">{s.description}</p>}
              </div>
              {isNext && s.href && (
                <Link
                  href={s.href}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-background px-3.5 text-sm font-semibold text-foreground transition-transform duration-150 hover:scale-[1.03] active:scale-95"
                >
                  {s.cta}
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
