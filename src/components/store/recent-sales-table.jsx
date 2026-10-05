import Link from "next/link";
import { ChevronRight, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/koetap/section-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAYMENT_LABELS } from "@/lib/pos";
import { formatMoney } from "@/lib/stores";

// The store's last sales as a table: when, who sold it, how many items, how much, and how it was paid.
export function RecentSalesTable({ sales, currency, reportsHref, posHref }) {
  return (
    <SectionCard
      title="Recent sales"
      description="The last 10 sales in this store"
      action={
        sales.length > 0 ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={reportsHref}>
              All sales
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
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">Sales show up here the moment a cashier completes one.</p>
          </div>
          <Button asChild size="sm">
            <Link href={posHref}>Open the POS</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead className="hidden sm:table-cell">Cashier</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-muted-foreground">{s.when}</TableCell>
                <TableCell className="hidden sm:table-cell">{s.cashierName}</TableCell>
                <TableCell className="text-right">{s.itemCount}</TableCell>
                <TableCell className="text-right font-semibold">{formatMoney(s.total, currency)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}
