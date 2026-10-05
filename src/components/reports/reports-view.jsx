"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Calculator, Package, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/auth/form-error";
import { StatGroup } from "@/components/ui/koetap/stat-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { SalesList } from "@/components/reports/sales-list";
import { PAYMENT_LABELS } from "@/lib/pos";
import { parseRange, percentChange, presetRange } from "@/lib/reports";
import { formatMoney } from "@/lib/stores";
import { cn } from "@/lib/utils";

const PRESET_BUTTONS = [
  ["today", "Today"],
  ["week", "This Week"],
  ["month", "This Month"],
  ["lastMonth", "Last Month"],
  ["custom", "Custom"],
];

// One summary number plus how it compares with the previous period, as an item for StatGroup.
function statItem({ label, value, current, previous, loading }) {
  if (loading) return { label, loading: true };

  const delta = percentChange(current, previous);
  let note;
  let noteTone;
  if (delta === null) {
    note = current > 0 ? "No sales in the previous period" : "No sales in either period";
  } else {
    note = `${delta > 0 ? "+" : ""}${delta}% vs last period`;
    if (delta > 0) noteTone = "text-success-ink";
    else if (delta < 0) noteTone = "text-error-ink";
  }
  return { label, value, note, noteTone };
}

function EmptyRow({ colSpan }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-muted-foreground">
        No sales in this period
      </TableCell>
    </TableRow>
  );
}

function LoadingRows({ colSpan }) {
  return Array.from({ length: 4 }, (_, i) => (
    <TableRow key={i}>
      <TableCell colSpan={colSpan}>
        <Skeleton className="h-5 w-full" />
      </TableCell>
    </TableRow>
  ));
}

// today: "YYYY-MM-DD", worked out on the server so the presets can't disagree between renders.
export function ReportsView({ storeId, currency, today }) {
  const [preset, setPreset] = useState("month");
  const [custom, setCustom] = useState(() => ({ from: presetRange("month", today).from, to: today }));

  // The range in effect, or why there isn't one yet (custom dates half filled in or invalid).
  const { range, rangeError } = useMemo(() => {
    if (preset !== "custom") return { range: presetRange(preset, today), rangeError: "" };
    if (!custom.from || !custom.to) return { range: null, rangeError: "Choose a start and an end date" };
    const parsed = parseRange(custom.from, custom.to);
    return parsed.error ? { range: null, rangeError: parsed.error } : { range: custom, rangeError: "" };
  }, [preset, custom, today]);

  const key = range ? `${range.from}|${range.to}` : null;

  // Results are stored with the range they belong to: while the key differs we're loading, and a
  // slow response for an old range can never overwrite the current one.
  const [data, setData] = useState({ key: null });

  useEffect(() => {
    if (!key) return;
    const [from, to] = key.split("|");
    const controller = new AbortController();

    const get = async (path) => {
      const res = await fetch(`/api/stores/${storeId}/reports/${path}?from=${from}&to=${to}`, {
        signal: controller.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not load the report");
      return body;
    };

    Promise.all([
      get("summary"),
      get("revenue"),
      get("top-products"),
      get("cashier-performance"),
      get("payment-methods"),
    ])
      .then(([summary, revenue, topProducts, cashiers, payments]) =>
        setData({ key, summary, revenue, topProducts, cashiers, payments })
      )
      .catch((err) => {
        if (err.name !== "AbortError") setData({ key, error: err.message });
      });

    return () => controller.abort();
  }, [storeId, key]);

  const current = key && data.key === key ? data : null;
  const loading = Boolean(key) && !current;
  const failed = current?.error;
  const ready = current && !current.error;
  const money = (n) => formatMoney(n, currency);
  const s = ready ? current.summary : null;

  return (
    <div className="space-y-8">
      {/* Range picker */}
      <div className="space-y-3">
        <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
          {PRESET_BUTTONS.map(([id, label]) => {
            const active = preset === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setPreset(id)}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-accent"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="range-from">From</Label>
              <Input
                id="range-from"
                type="date"
                max={today}
                value={custom.from}
                onChange={(e) => setCustom({ ...custom, from: e.target.value })}
                className="w-44"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="range-to">To</Label>
              <Input
                id="range-to"
                type="date"
                max={today}
                value={custom.to}
                onChange={(e) => setCustom({ ...custom, to: e.target.value })}
                className="w-44"
              />
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {range ? `${range.from} to ${range.to}. ` : ""}Dates and times are in UTC.
        </p>
        {rangeError && (
          <p role="alert" className="text-sm text-destructive">
            {rangeError}
          </p>
        )}
      </div>

      {failed && <FormError>{failed}</FormError>}

      {range && !failed && (
        <>
          {/* Summary */}
          <StatGroup
            aria-label="Summary"
            items={[
              statItem({ label: "Total Revenue", loading, value: s && money(s.revenue), current: s?.revenue, previous: s?.previousRevenue }),
              statItem({ label: "Total Transactions", loading, value: s?.transactions, current: s?.transactions, previous: s?.previousTransactions }),
              statItem({ label: "Average Order Value", loading, value: s && money(s.avgOrderValue), current: s?.avgOrderValue, previous: s?.previousAvgOrderValue }),
              statItem({ label: "Items Sold", loading, value: s?.itemsSold, current: s?.itemsSold, previous: s?.previousItemsSold }),
            ]}
          />

          {/* Revenue chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>
                {ready ? (current.revenue.interval === "hour" ? "By hour" : "By day") : " "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : s.transactions === 0 ? (
                <p className="py-24 text-center text-sm text-muted-foreground">No sales in this period</p>
              ) : (
                <RevenueChart
                  points={current.revenue.points}
                  interval={current.revenue.interval}
                  currency={currency}
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 2xl:grid-cols-2">
            {/* Top products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <LoadingRows colSpan={4} />
                    ) : current.topProducts.length === 0 ? (
                      <EmptyRow colSpan={4} />
                    ) : (
                      current.topProducts.map((p, i) => (
                        <TableRow key={p.productId ?? i}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium whitespace-normal [overflow-wrap:anywhere]">{p.name}</TableCell>
                          <TableCell className="text-right">{p.unitsSold}</TableCell>
                          <TableCell className="text-right">{money(p.revenue)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cashier performance */}
            <Card>
              <CardHeader>
                <CardTitle>Cashier Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cashier</TableHead>
                      <TableHead className="text-right">
                        <span className="sm:hidden">Orders</span>
                        <span className="hidden sm:inline">Transactions</span>
                      </TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <LoadingRows colSpan={4} />
                    ) : current.cashiers.length === 0 ? (
                      <EmptyRow colSpan={4} />
                    ) : (
                      current.cashiers.map((c, i) => (
                        <TableRow key={c.cashierId ?? i}>
                          <TableCell className="font-medium whitespace-normal [overflow-wrap:anywhere]">{c.cashierName}</TableCell>
                          <TableCell className="text-right">{c.transactions}</TableCell>
                          <TableCell className="text-right">{money(c.revenue)}</TableCell>
                          <TableCell className="text-right">{money(c.avgOrderValue)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Payment methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : current.payments.total === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No sales in this period</p>
              ) : (
                <ul className="space-y-4">
                  {current.payments.methods.map((m) => (
                    <li key={m.method}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{PAYMENT_LABELS[m.method]}</span>
                        <span className="text-muted-foreground">
                          {m.count} {m.count === 1 ? "sale" : "sales"} · {m.percentage}% · {money(m.revenue)}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${PAYMENT_LABELS[m.method]} share of sales`}
                        aria-valuenow={m.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-3 overflow-hidden rounded-full bg-muted"
                      >
                        <div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${m.percentage}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Sales list */}
          <Card>
            <CardHeader>
              <CardTitle>Sales</CardTitle>
              <CardDescription>Click a sale to see its items.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* The key remounts the list for every new range, so it always starts again on page 1. */}
              <SalesList key={key} storeId={storeId} from={range.from} to={range.to} currency={currency} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
