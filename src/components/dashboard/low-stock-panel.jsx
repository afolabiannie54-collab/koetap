import Link from "next/link";
import { CircleCheck, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/koetap/section-card";

// Products that need restocking soon, soonest first. Each row opens that store's products already filtered to
// "low stock". An empty list is good news, so it says so.
export function LowStockPanel({ items, count, showStore = false, hrefFor }) {
  return (
    <SectionCard
      title="Running low"
      description="Restock these before they sell out"
      action={
        count > items.length ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={hrefFor(items[0])}>
              See all {count}
              <ChevronRight />
            </Link>
          </Button>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-success-soft text-success-ink">
            <CircleCheck className="size-6" strokeWidth={1.75} />
          </span>
          <p className="font-semibold">Everything is well stocked</p>
          <p className="max-w-xs text-sm text-muted-foreground">Products that run low will be listed here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={hrefFor(p)}
                className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-accent/60 focus-visible:relative focus-visible:z-10"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  {showStore && <p className="truncate text-xs text-muted-foreground">{p.storeName}</p>}
                </div>
                <Badge variant={p.stock === 0 ? "destructive" : "warning"}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
