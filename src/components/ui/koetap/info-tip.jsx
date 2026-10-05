import { Info } from "lucide-react";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { cn } from "@/lib/utils";

// A small (i) next to a label. Hover it, or Tab to it, for a plain-language explanation of what the
// number or setting means. Drawn through KTooltip, so it is never covered or clipped.
export function InfoTip({ children, label = "What is this?", side = "top", className }) {
  return (
    <KTooltip label={children} side={side}>
      <button
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex size-5 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground",
          className
        )}
      >
        <Info className="size-3.5" />
      </button>
    </KTooltip>
  );
}
