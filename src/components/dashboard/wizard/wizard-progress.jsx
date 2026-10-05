import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// The steps of the wizard as connected circles with labels underneath.
//   done:     filled black circle with a check (and clickable, to go back to that step)
//   current:  filled black circle with its number
//   upcoming: empty grey circle (not clickable: you can't skip ahead)
// The line between two steps fills in as the earlier step is completed.
export function WizardProgress({ steps, current, onGo }) {
  return (
    <ol className="flex items-start justify-center" aria-label="Setup progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-start" aria-current={active ? "step" : undefined}>
            <div className="flex w-16 flex-col items-center gap-1.5 sm:w-20">
              <button
                type="button"
                disabled={!done}
                onClick={() => onGo(i)}
                aria-label={done ? `Go back to ${label}` : `${label}, step ${i + 1}`}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                  done && "cursor-pointer border-foreground bg-foreground text-background hover:scale-105",
                  active && "border-foreground bg-foreground text-background ring-4 ring-foreground/15",
                  !done && !active && "cursor-default border-input bg-card text-muted-foreground"
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </button>
              <span className={cn("text-xs transition-colors duration-300", active ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div aria-hidden="true" className="mt-[17px] h-0.5 w-10 overflow-hidden rounded-full bg-border sm:w-20">
                <div className={cn("h-full bg-foreground transition-[width] duration-500 ease-out", done ? "w-full" : "w-0")} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
