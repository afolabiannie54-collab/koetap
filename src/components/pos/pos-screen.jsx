"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, Clock, LogOut, Minus, Package, Pause, Plus, Search, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormError } from "@/components/auth/form-error";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";
import { useToast } from "@/components/ui/koetap/toast";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { ReceiptPanel, StoreBrand } from "@/components/pos/receipt-panel";
import { PAYMENT_LABELS, PAYMENT_METHODS, newSaleKey, readableTextColor, roundMoney } from "@/lib/pos";
import { formatMoney } from "@/lib/stores";
import {
  addHeldOrder,
  clearAllHeldOrders,
  heldOrderTotal,
  parseHeld,
  readHeldRaw,
  removeHeldOrder,
  serverHeldRaw,
  subscribeHeld,
  timeAgo,
} from "@/lib/held-orders";
import { cn } from "@/lib/utils";

// The store's accent colour drives the buttons and selected states. A store with no accent colour falls
// back to Koetap's own black (white in dark mode), so it never looks unfinished.
const ACCENT = { background: "var(--store-accent, var(--primary))", color: "var(--store-accent-fg, var(--primary-foreground))" };
const ACCENT_EDGE = { borderColor: "var(--store-accent, var(--foreground))", boxShadow: "0 0 0 1px var(--store-accent, var(--foreground))" };

// A live clock without setting state in an effect. null on the server so it can't mismatch.
const subscribeClock = (onChange) => {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
};
const clockSnapshot = () => Math.floor(Date.now() / 1000);
const serverClock = () => null;

function useClock() {
  const seconds = useSyncExternalStore(subscribeClock, clockSnapshot, serverClock);
  return seconds === null ? null : new Date(seconds * 1000);
}

export function PosScreen({ store, cashierName, role, initialProducts }) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(store.accentColor) ? store.accentColor : null;
  const money = (n) => formatMoney(n, store.currency);
  const now = useClock();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();

  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState({}); // productId -> quantity
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [discount, setDiscount] = useState("");
  // Nothing is pre-selected: a transfer sale must never be recorded as cash just because nobody tapped.
  const [payment, setPayment] = useState(null);
  const [cartOpen, setCartOpen] = useState(false); // the bottom sheet on small screens
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState("");
  // Stops a second tap in the same instant, before React has had time to disable the button.
  const submitLock = useRef(false);
  // The reference sent with the current sale. It is kept while we don't know whether a sale went
  // through (dropped connection), so tapping again can't charge twice.
  const attempt = useRef(null);
  const [receipt, setReceipt] = useState(null);

  // Held sales: kept in this browser only. The raw string is what useSyncExternalStore watches.
  const heldRaw = useSyncExternalStore(subscribeHeld, () => readHeldRaw(store.id), serverHeldRaw);
  const heldOrders = useMemo(() => parseHeld(heldRaw), [heldRaw]);
  const [heldOpen, setHeldOpen] = useState(false);
  // Name/price remembered for lines restored from a held order, which are shown even if the
  // product has since disappeared from the POS.
  const [restored, setRestored] = useState({});

  const productMap = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, search, category]);

  // Cart lines use the live product (price, stock). A product that vanished or no longer has
  // enough stock after a refresh is flagged and blocks the sale until fixed.
  const lines = Object.entries(cart).map(([id, quantity]) => {
    const product = productMap.get(id);
    return {
      id,
      quantity,
      product,
      name: product?.name ?? restored[id]?.name ?? "Unavailable product",
      fromHeld: id in restored,
      problem: !product ? "No longer available" : quantity > product.stock ? `Only ${product.stock} left` : "",
    };
  });
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.quantity : 0), 0));
  const discountValue = discount === "" ? 0 : Number(discount);
  const discountError =
    !Number.isFinite(discountValue) || discountValue < 0
      ? "Enter a discount of 0 or more"
      : discountValue > subtotal
        ? "Discount can't be more than the subtotal"
        : "";
  const total = roundMoney(subtotal - (discountError ? 0 : discountValue));
  const hasProblem = lines.some((l) => l.problem);
  const canComplete = lines.length > 0 && !hasProblem && !discountError && Boolean(payment);

  function startNewSale() {
    setReceipt(null);
    setSaleError("");
    setPayment(null);
  }

  function addToCart(p) {
    // Tapping a product while the last receipt is still showing starts the next sale.
    if (receipt) startNewSale();
    setSaleError("");
    setCart((c) => {
      const next = (c[p._id] ?? 0) + 1;
      return next > p.stock ? c : { ...c, [p._id]: next };
    });
  }

  function changeQuantity(id, delta) {
    setSaleError("");
    setCart((c) => {
      const next = (c[id] ?? 0) + delta;
      const stock = productMap.get(id)?.stock ?? Infinity;
      return next < 1 || next > stock ? c : { ...c, [id]: next };
    });
  }

  function removeLine(id) {
    setSaleError("");
    setCart((c) => {
      const { [id]: _removed, ...rest } = c;
      return rest;
    });
    setRestored((r) => {
      const { [id]: _gone, ...rest } = r;
      return rest;
    });
  }

  async function refreshProducts() {
    try {
      const res = await fetch(`/api/pos/${store.id}/products`);
      if (res.ok) setProducts((await res.json()).products);
    } catch {
      // Keep showing what we have; the next sale attempt will report any real problem.
    }
  }

  async function submitSale() {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setSaleError("");

    // Prices are not sent: the server charges the product's current price.
    const body = {
      items: lines.map((l) => ({ productId: l.id, quantity: l.quantity })),
      paymentMethod: payment,
      discount: discountValue,
    };
    // One reference per distinct sale. Retrying the same cart reuses it; changing the cart starts a new one.
    const signature = JSON.stringify(body);
    if (attempt.current?.signature !== signature) attempt.current = { key: newSaleKey(), signature };

    let res = null;
    let data = {};
    // Don't leave the cashier staring at "Processing..." if the network or database stalls.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      res = await fetch(`/api/pos/${store.id}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, clientRef: attempt.current.key }),
        signal: controller.signal,
      });
      data = await res.json().catch(() => ({}));
    } catch {
      res = null;
    } finally {
      clearTimeout(timer);
    }
    submitLock.current = false;
    setSubmitting(false);
    setConfirmOpen(false);

    // We don't know if it went through (no answer, or a gateway error): keep the reference so a retry is safe.
    if (!res || res.status >= 500) {
      setSaleError(
        "The connection is slow or dropped, so we can't tell if this sale went through. Tap Complete Sale again. It will not be charged twice."
      );
      return;
    }

    if (!res.ok) {
      // The server answered no, so nothing was recorded. The cart stays as it was so the cashier can fix it.
      attempt.current = null;
      setSaleError(data.error || "Could not complete the sale");
      refreshProducts(); // stock may have changed under us
      return;
    }

    attempt.current = null;
    setReceipt(data.sale);
    setCart({});
    setRestored({});
    setDiscount("");
    setCartOpen(true); // on a phone, show the receipt straight away
    refreshProducts();
  }

  function holdSale() {
    const saved = addHeldOrder(store.id, {
      items: lines.map((l) => ({
        productId: l.id,
        name: l.name,
        price: l.product?.price ?? restored[l.id]?.price ?? 0,
        quantity: l.quantity,
      })),
      discount: discountError ? 0 : discountValue,
      paymentMethod: payment,
    });

    // If the browser won't store it, keep the cart rather than lose the sale.
    if (!saved) {
      toast.error("Could not hold the sale: this browser blocked storage");
      return;
    }

    setCart({});
    setRestored({});
    setDiscount("");
    setPayment(null);
    setSaleError("");
    setCartOpen(false);
    toast.success("Sale held");
  }

  async function restoreHeld(order) {
    if (
      lines.length > 0 &&
      !(await confirm({
        title: "Replace your current cart?",
        description: "This will replace your current cart. Continue?",
        confirmLabel: "Replace cart",
      }))
    ) {
      return;
    }

    if (receipt) setReceipt(null);
    setCart(Object.fromEntries(order.items.map((i) => [i.productId, i.quantity])));
    setRestored(Object.fromEntries(order.items.map((i) => [i.productId, { name: i.name, price: i.price }])));
    setDiscount(order.discount > 0 ? String(order.discount) : "");
    setPayment(PAYMENT_METHODS.includes(order.paymentMethod) ? order.paymentMethod : null);
    setSaleError("");
    removeHeldOrder(store.id, order.id);
    setHeldOpen(false);
    setCartOpen(true);
    refreshProducts(); // so stock warnings reflect the shelf as it is now
  }

  async function discardHeld(order) {
    if (
      !(await confirm({
        title: "Discard this held order?",
        description: "It will be removed from this device and can't be brought back.",
        confirmLabel: "Discard",
        destructive: true,
      }))
    ) {
      return;
    }
    removeHeldOrder(store.id, order.id);
  }

  function signOutCashier() {
    clearAllHeldOrders();
    signOut({ callbackUrl: "/login" });
  }

  const rootStyle = accent ? { "--store-accent": accent, "--store-accent-fg": readableTextColor(accent) } : undefined;
  const clock = now ? now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";

  return (
    <div style={rootStyle} className="relative flex h-dvh flex-col overflow-hidden bg-canvas text-foreground">
      {/* Header bar */}
      <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <div className="flex min-w-0 shrink-0 items-center">
          <StoreBrand store={store} className="max-w-48 text-lg" />
        </div>
        {/* With a logo on the left, the store's name sits in the middle */}
        <div className="min-w-0 flex-1 text-center">
          {store.logoUrl && <span className="hidden truncate text-sm font-semibold sm:inline">{store.name}</span>}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {heldOrders.length > 0 && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setHeldOpen(true)}>
              <Clock />
              Held ({heldOrders.length})
            </Button>
          )}
          <div className="hidden text-right leading-tight sm:block">
            <p className="max-w-40 truncate text-sm font-semibold">{cashierName}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{clock}</p>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums sm:hidden">{clock.slice(0, 5)}</p>
          <ThemeToggle />
          {role === "cashier" ? (
            <KTooltip label="Sign out" align="end">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Sign out" onClick={signOutCashier}>
                <LogOut />
              </Button>
            </KTooltip>
          ) : (
            <KTooltip label="Back to dashboard" align="end">
              <Button asChild variant="ghost" size="icon-sm">
                <Link href={`/stores/${store.id}`} aria-label="Back to dashboard">
                  <ArrowLeft />
                </Link>
              </Button>
            </KTooltip>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* LEFT: products */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="space-y-3 border-b border-border bg-background px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="h-12 pl-11 text-base"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["all", ...categories].map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    aria-pressed={active}
                    style={active ? ACCENT : undefined}
                    className={cn(
                      "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-all duration-150 active:scale-95",
                      active ? "border-transparent" : "border-input bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {c === "all" ? "All" : c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-28 lg:pb-4">
            {products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
                <Package className="size-10" strokeWidth={1.5} />
                <p>No products in this store yet.</p>
              </div>
            ) : visible.length === 0 ? (
              <p className="py-20 text-center text-muted-foreground">No products match your search.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {visible.map((p) => {
                  const out = p.stock <= 0;
                  const inCart = cart[p._id] ?? 0;
                  const low = !out && p.stock <= store.lowStockThreshold;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      disabled={out}
                      onClick={() => addToCart(p)}
                      style={inCart > 0 ? ACCENT_EDGE : undefined}
                      className={cn(
                        "group/product relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                        out
                          ? "cursor-not-allowed"
                          : "hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:duration-100"
                      )}
                    >
                      {/* Picture area: a placeholder icon until products can have images */}
                      <span
                        className={cn(
                          "flex aspect-[5/3] items-center justify-center bg-muted text-muted-foreground",
                          out && "opacity-50 grayscale"
                        )}
                      >
                        <Package className="size-8" strokeWidth={1.5} />
                      </span>

                      <span className={cn("flex flex-1 flex-col gap-1 p-3", out && "opacity-50")}>
                        <span className="line-clamp-2 text-sm leading-snug font-semibold">{p.name}</span>
                        <span className="mt-auto flex items-end justify-between gap-2 pt-1">
                          <span className="text-base font-bold">{money(p.price)}</span>
                          {!out && (
                            <Badge variant={low ? "warning" : "secondary"} className="h-5 px-2 text-[11px]">
                              {p.stock} left
                            </Badge>
                          )}
                        </span>
                      </span>

                      {out && (
                        <span className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                            Out of Stock
                          </span>
                        </span>
                      )}

                      {inCart > 0 && (
                        <span
                          style={ACCENT}
                          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-sm font-bold shadow-md"
                        >
                          {inCart}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Phones: a bar at the bottom that opens the cart (or the receipt) */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background p-3 lg:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            style={ACCENT}
            className="flex h-14 w-full items-center justify-between rounded-xl px-5 text-base font-semibold transition-transform active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="size-5" />
              {receipt ? "View receipt" : itemCount === 0 ? "Cart is empty" : `View cart (${itemCount})`}
            </span>
            <span>{receipt ? money(receipt.total) : money(total)}</span>
          </button>
        </div>

        {cartOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden" onClick={() => setCartOpen(false)} aria-hidden="true" />
        )}

        {/* RIGHT: cart, or the receipt right after a sale (a fixed 320px panel; a slide-up sheet on phones) */}
        <aside
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex h-[88dvh] flex-col rounded-t-3xl border border-border bg-card shadow-lg transition-transform duration-300",
            cartOpen ? "translate-y-0" : "translate-y-full",
            "lg:static lg:z-auto lg:h-auto lg:w-80 lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-none"
          )}
        >
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
            className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>

          {receipt ? (
            <ReceiptPanel sale={receipt} store={store} onNewSale={startNewSale} />
          ) : (
            <>
              <header className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
                <h2 className="text-base font-semibold tracking-tight">Cart</h2>
                {itemCount > 0 && (
                  <span style={ACCENT} className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold">
                    {itemCount}
                  </span>
                )}
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-2">
                {lines.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                      <ShoppingBag className="size-7" strokeWidth={1.5} />
                    </span>
                    <p className="text-sm">Add items to get started</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {lines.map((l) => (
                      <li key={l.id} className={cn("py-3", l.fromHeld && l.problem && "-mx-2 rounded-xl bg-error-soft px-2")}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={cn("truncate text-sm font-semibold", l.fromHeld && l.problem && "text-error-ink")}>{l.name}</p>
                            {l.product && <p className="text-xs text-muted-foreground">{money(l.product.price)} each</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(l.id)}
                            aria-label={`Remove ${l.name}`}
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error-soft hover:text-error-ink"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => changeQuantity(l.id, -1)}
                              disabled={l.quantity <= 1}
                              aria-label="Decrease quantity"
                              className="flex size-9 items-center justify-center rounded-lg border border-input transition-all duration-150 hover:bg-accent active:scale-95 disabled:opacity-40"
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="w-9 text-center text-base font-semibold tabular-nums">{l.quantity}</span>
                            <button
                              type="button"
                              onClick={() => changeQuantity(l.id, 1)}
                              disabled={!l.product || l.quantity >= l.product.stock}
                              aria-label="Increase quantity"
                              className="flex size-9 items-center justify-center rounded-lg border border-input transition-all duration-150 hover:bg-accent active:scale-95 disabled:opacity-40"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                          <p className="text-base font-bold">{l.product ? money(roundMoney(l.product.price * l.quantity)) : "-"}</p>
                        </div>
                        {l.problem && (
                          <p role="alert" className="mt-1.5 text-xs font-medium text-error-ink">
                            {l.fromHeld
                              ? `This item may no longer be available. Check before completing sale. (${l.problem})`
                              : `${l.problem}. Reduce the quantity or remove it.`}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <footer className="space-y-3 border-t border-border px-4 py-3">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-medium">{money(subtotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">
                      <label htmlFor="discount">Discount</label>
                    </dt>
                    <dd>
                      <Input
                        id="discount"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        aria-invalid={Boolean(discountError)}
                        className="h-9 w-28 rounded-lg px-2.5 text-right"
                      />
                    </dd>
                  </div>
                  {discountError && lines.length > 0 && (
                    <p role="alert" className="text-right text-xs text-error-ink">
                      {discountError}
                    </p>
                  )}
                  <div className="flex items-baseline justify-between border-t border-border pt-2.5">
                    <dt className="text-base font-semibold">Total</dt>
                    <dd className="text-3xl font-bold tracking-tight">{money(total)}</dd>
                  </div>
                </dl>

                <div
                  role="group"
                  aria-label="Payment method"
                  className={cn("grid grid-cols-3 gap-2 rounded-2xl", lines.length > 0 && !payment && "ring-2 ring-warning ring-offset-2 ring-offset-card")}
                >
                  {PAYMENT_METHODS.map((m) => {
                    const active = payment === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayment(m)}
                        aria-pressed={active}
                        style={active ? ACCENT : undefined}
                        className={cn(
                          "h-11 rounded-full border text-sm font-semibold transition-all duration-150 active:scale-95",
                          active ? "border-transparent" : "border-input bg-background text-foreground hover:bg-accent"
                        )}
                      >
                        {PAYMENT_LABELS[m]}
                      </button>
                    );
                  })}
                </div>

                {lines.length > 0 && !payment && (
                  <p className="text-center text-sm font-medium text-warning-ink">Choose how the customer is paying</p>
                )}

                {saleError && <FormError>{saleError}</FormError>}

                {lines.length > 0 && (
                  <Button type="button" variant="secondary" size="lg" className="w-full" onClick={holdSale}>
                    <Pause />
                    Hold Sale
                  </Button>
                )}

                <Button
                  type="button"
                  size="lg"
                  disabled={!canComplete}
                  onClick={() => setConfirmOpen(true)}
                  style={ACCENT}
                  className="h-14 w-full text-base font-bold"
                >
                  Complete Sale{lines.length > 0 && ` · ${money(total)}`}
                </Button>
              </footer>
            </>
          )}
        </aside>
      </div>

      {/* Held orders */}
      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Held orders</DialogTitle>
            <DialogDescription>Saved on this device. Restore one to carry on with that sale.</DialogDescription>
          </DialogHeader>

          {heldOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No held orders.</p>
          ) : (
            <ul className="max-h-[60dvh] space-y-3 overflow-y-auto">
              {[...heldOrders].reverse().map((order) => {
                const count = order.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <li key={order.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">Held {timeAgo(order.heldAt, now ?? new Date(order.heldAt))}</p>
                        <p className="text-xs text-muted-foreground">
                          {count} {count === 1 ? "item" : "items"}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-bold">{money(heldOrderTotal(order))}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button type="button" onClick={() => restoreHeld(order)} style={ACCENT}>
                        Restore
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => discardHeld(order)}>
                        Discard
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm the sale */}
      <Dialog open={confirmOpen} onOpenChange={(open) => !submitting && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm sale</DialogTitle>
            <DialogDescription>Check the items and the payment method before you confirm.</DialogDescription>
          </DialogHeader>

          <ul className="max-h-[40dvh] divide-y divide-border overflow-y-auto rounded-xl border border-border px-3" aria-label="Items in this sale">
            {lines.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-muted-foreground"> × {l.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">{l.product ? money(roundMoney(l.product.price * l.quantity)) : "-"}</span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <dt>Discount</dt>
                <dd>-{money(discountValue)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <dt className="text-muted-foreground">Paid by</dt>
              <dd style={ACCENT} className="rounded-full px-3 py-1 text-sm font-bold">
                {PAYMENT_LABELS[payment]}
              </dd>
            </div>
          </dl>

          <p className="py-1 text-center text-4xl font-bold tracking-tight">{money(total)}</p>

          <DialogFooter>
            <Button type="button" variant="secondary" size="lg" disabled={submitting} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="lg" disabled={submitting} onClick={submitSale} style={ACCENT}>
              {submitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}
