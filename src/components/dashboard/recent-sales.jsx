import Link from "next/link";
import { ArrowLeftRight, Banknote, ChevronRight, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/koetap/section-card";
import { PAYMENT_LABELS } from "@/lib/pos";
import { formatMoney } from "@/lib/stores";

const METHOD_ICON = { cash: Banknote, transfer: ArrowLeftRight, other: Wallet };

// The latest sales as a list: how much, how many items, who sold it, how it was paid, and when.
// showStore adds the store's name (for the dashboard, which spans every store).
export function RecentSales({ sales, currency, showStore = false, reportsHref, openPosHref }) {
  return (
    <SectionCard
      title="Recent sales"
      description={showStore ? "The latest sales across your stores" : "The latest sales in this store"}
      action={
        reportsHref && sales.length > 0 ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={reportsHref}>
              All reports
              <ChevronRight />
            </Link>
          </Button>
        ) : null
      }
    >
      {sales.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Receipt className="size-6" strokeWidth={1.5} />
          </span>
          <div>
            <p className="font-semibold">No sales yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Sales show up here the moment a cashier completes one.
            </p>
          </div>
          {openPosHref && (
            <Button asChild size="sm">
              <Link href={openPosHref}>Open the POS</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {sales.map((s) => {
            const Icon = METHOD_ICON[s.paymentMethod] ?? Wallet;
            return (
              <li key={s.id} className="flex items-center gap-3.5 px-5 py-3 transition-colors duration-150 hover:bg-accent/60">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold">{formatMoney(s.total, currency)}</span>
                    <span className="text-muted-foreground">
                      {s.itemCount} {s.itemCount === 1 ? "item" : "items"}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.cashierName}
                    {showStore && s.storeName ? ` · ${s.storeName}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="secondary">{PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod}</Badge>
                  <span className="text-xs text-muted-foreground">{s.when}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
