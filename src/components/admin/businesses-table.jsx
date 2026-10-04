"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/stores";
import { cn } from "@/lib/utils";

const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" });

const SUSPEND_WARNING = (name) =>
  `Suspend "${name}"?\n\nThis switches off all of its stores and cashiers, and its owner is locked out until you reinstate it.`;
const REINSTATE_WARNING = (name) =>
  `Reinstate "${name}"?\n\nThe owner can sign in again. The stores and cashiers this suspension switched off are switched back on. Anything the owner had turned off themselves stays off.`;

export function BusinessesTable() {
  const [searchInput, setSearchInput] = useState("");
  const [params, setParams] = useState({ search: "", plan: "all", status: "all", page: 1 });
  const [reloads, setReloads] = useState(0);
  const [result, setResult] = useState({ key: null });
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const debounce = useRef(null);

  const key = `${params.search}|${params.plan}|${params.status}|${params.page}|${reloads}`;

  // Results are stored with the request they answer, so a slow response for an old search can
  // never replace the newer one, and "loading" is simply "the stored key isn't the current key".
  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams({
      search: params.search,
      plan: params.plan,
      status: params.status,
      page: String(params.page),
      limit: "25",
    });

    fetch(`/api/admin/businesses?${qs}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Could not load businesses");
        setResult({ key, ...body });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setResult({ key, error: err.message });
      });

    return () => controller.abort();
  }, [params, key]);

  const current = result.key === key ? result : null;
  const loading = !current;

  // Typing waits for a short pause before searching, and any new search starts again at page 1.
  function onSearchChange(value) {
    setSearchInput(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParams((p) => ({ ...p, search: value.trim(), page: 1 })), 300);
  }

  async function toggleActive(b) {
    if (!window.confirm(b.isActive ? SUSPEND_WARNING(b.name) : REINSTATE_WARNING(b.name))) return;

    setMessage({ type: "", text: "" });
    setBusyId(b._id);
    const res = await fetch(`/api/admin/businesses/${b._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Could not update the business" });
      return;
    }
    setMessage({
      type: "success",
      text: b.isActive
        ? `${b.name} suspended. ${data.cascade.stores} stores and ${data.cascade.cashiers} cashiers switched off.`
        : `${b.name} reinstated. ${data.restored.stores} stores and ${data.restored.cashiers} cashiers switched back on.`,
    });
    setReloads((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by business name or owner email"
            aria-label="Search businesses"
            className="pl-8"
          />
        </div>
        <Select value={params.plan} onValueChange={(plan) => setParams((p) => ({ ...p, plan, page: 1 }))}>
          <SelectTrigger className="w-36" aria-label="Filter by plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.status} onValueChange={(status) => setParams((p) => ({ ...p, status, page: 1 }))}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {message.text && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700"
          )}
        >
          {message.text}
        </p>
      )}

      {current?.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {current.error}
        </p>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell">Owner Email</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell text-right">Stores</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell text-right">Total Sales</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell text-right">Total Revenue</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell">Plan</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell">Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : current.businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No businesses match.
                  </TableCell>
                </TableRow>
              ) : (
                current.businesses.map((b) => (
                  <TableRow key={b._id} className={cn(!b.isActive && "bg-red-50/50")}>
                    <TableCell className="font-medium whitespace-normal [overflow-wrap:anywhere]">
                      {b.name}
                      {/* On narrower screens the other columns are summarised here */}
                      <div className="mt-1 space-y-0.5 text-xs font-normal text-muted-foreground min-[1300px]:hidden">
                        <p>{b.ownerEmail || "-"}</p>
                        <p>
                          {b.stores} {b.stores === 1 ? "store" : "stores"} · {b.totalSales} sales · {formatMoney(b.totalRevenue)} ·{" "}
                          {b.plan === "paid" ? "Paid" : "Free"} · Joined {formatDate(b.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell whitespace-normal [overflow-wrap:anywhere]">{b.ownerEmail || "-"}</TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell text-right">{b.stores}</TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell text-right">{b.totalSales}</TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell text-right">{formatMoney(b.totalRevenue)}</TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell">
                      <Badge variant={b.plan === "paid" ? "default" : "secondary"}>
                        {b.plan === "paid" ? "Paid" : "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell whitespace-nowrap">{formatDate(b.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={b.isActive ? "outline" : "destructive"}>{b.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:justify-end">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/businesses/${b._id}`}>View</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant={b.isActive ? "destructive" : "secondary"}
                          disabled={busyId === b._id}
                          onClick={() => toggleActive(b)}
                        >
                          {b.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {current && !current.error && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {current.total} {current.total === 1 ? "business" : "businesses"} · Page {current.page} of {current.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current.page <= 1}
              onClick={() => setParams((p) => ({ ...p, page: current.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current.page >= current.totalPages}
              onClick={() => setParams((p) => ({ ...p, page: current.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
