"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAYMENT_LABELS } from "@/lib/pos";
import { formatMoney } from "@/lib/stores";

const formatTime = (d) =>
  new Date(d).toLocaleString("en-NG", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" });

// Phones get a shorter timestamp so the Total column fits.
const formatTimeShort = (d) =>
  new Date(d).toLocaleString("en-NG", { timeZone: "UTC", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

export function SalesList({ storeId, from, to, currency }) {
  // The parent remounts this component for every new range, so page state starts at 1 each time.
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ key: null });
  const [expanded, setExpanded] = useState(() => new Set());

  const key = `${from}|${to}|${page}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/stores/${storeId}/reports/sales?from=${from}&to=${to}&page=${page}&limit=20`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Could not load sales");
        setResult({ key, ...body });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setResult({ key, error: err.message });
      });
    return () => controller.abort();
  }, [storeId, from, to, page, key]);

  const current = result.key === key ? result : null;
  const loading = !current;

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const exportHref = `/api/stores/${storeId}/reports/sales/export?from=${from}&to=${to}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {current && !current.error ? `${current.total} ${current.total === 1 ? "sale" : "sales"} in this period` : " "}
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={exportHref} download>
            <Download data-icon="inline-start" />
            Export CSV
          </a>
        </Button>
      </div>

      {current?.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {current.error}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time (UTC)</TableHead>
                <TableHead className="hidden sm:table-cell">Cashier</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden sm:table-cell">Payment</TableHead>
                <TableHead className="hidden md:table-cell">Receipt Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : current.sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No sales in this period
                  </TableCell>
                </TableRow>
              ) : (
                current.sales.map((sale) => {
                  const open = expanded.has(sale._id);
                  return (
                    <Fragment key={sale._id}>
                      <TableRow
                        onClick={() => toggle(sale._id)}
                        className="cursor-pointer"
                        data-testid="sale-row"
                      >
                        <TableCell className="whitespace-nowrap">
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-label={`${open ? "Hide" : "Show"} items for the sale at ${formatTime(sale.createdAt)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(sale._id);
                            }}
                            className="mr-2 inline-flex align-middle text-muted-foreground"
                          >
                            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          </button>
                          <span className="sm:hidden">{formatTimeShort(sale.createdAt)}</span>
                          <span className="hidden sm:inline">{formatTime(sale.createdAt)}</span>
                        </TableCell>
                        <TableCell className="hidden whitespace-normal [overflow-wrap:anywhere] sm:table-cell">{sale.cashierName}</TableCell>
                        <TableCell className="text-right">{sale.itemCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatMoney(sale.total, currency)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={sale.receiptSent ? "default" : "outline"}>
                            {sale.receiptSent ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {open && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={6}>
                            <div className="max-w-xl space-y-3 py-1">
                              <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                                Cashier: <span className="font-medium text-foreground">{sale.cashierName}</span>
                                {" · "}Paid by: <span className="font-medium text-foreground">{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
                                {" · "}Receipt sent: <span className="font-medium text-foreground">{sale.receiptSent ? "Yes" : "No"}</span>
                              </p>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-muted-foreground">
                                    <th className="pb-1 font-medium">Product</th>
                                    <th className="pb-1 text-right font-medium">Qty</th>
                                    <th className="pb-1 text-right font-medium">Unit price</th>
                                    <th className="pb-1 text-right font-medium">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.items.map((item, i) => (
                                    <tr key={`${item.productId}-${i}`}>
                                      <td className="py-0.5">{item.name}</td>
                                      <td className="py-0.5 text-right">{item.quantity}</td>
                                      <td className="py-0.5 text-right">{formatMoney(item.price, currency)}</td>
                                      <td className="py-0.5 text-right">{formatMoney(item.total, currency)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <dl className="ml-auto w-56 space-y-0.5 border-t pt-2 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Subtotal</dt>
                                  <dd>{formatMoney(sale.subtotal, currency)}</dd>
                                </div>
                                {sale.discount > 0 && (
                                  <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Discount</dt>
                                    <dd>-{formatMoney(sale.discount, currency)}</dd>
                                  </div>
                                )}
                                <div className="flex justify-between font-semibold">
                                  <dt>Total</dt>
                                  <dd>{formatMoney(sale.total, currency)}</dd>
                                </div>
                              </dl>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {current && !current.error && current.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {current.page} of {current.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current.page <= 1}
              onClick={() => setPage(current.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current.page >= current.totalPages}
              onClick={() => setPage(current.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
