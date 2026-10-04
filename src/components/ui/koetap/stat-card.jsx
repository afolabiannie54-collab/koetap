import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// One number with a label and a small icon. `note` sits underneath (for example a comparison with last period).
export function StatCard({ icon: Icon, label, value, note, noteTone, hover = false, className }) {
  return (
    <Card hover={hover} className={cn("gap-3", className)}>
      <div className="flex items-center justify-between gap-3 px-(--card-spacing)">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
        )}
      </div>
      <div className="px-(--card-spacing)">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {note && <p className={cn("mt-1 text-xs font-medium", noteTone ?? "text-muted-foreground")}>{note}</p>}
      </div>
    </Card>
  );
}
