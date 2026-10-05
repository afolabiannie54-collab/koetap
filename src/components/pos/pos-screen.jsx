"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  Clock,
  LogOut,
  Minus,
  Pause,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormError } from "@/components/auth/form-error";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";
import { useToast } from "@/components/ui/koetap/toast";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { ReceiptPanel, StoreBrand } from "@/components/pos/receipt-panel";
import { EmptyIcon } from "@/components/ui/koetap/empty-icon";
import { FadeImage } from "@/components/ui/koetap/fade-image";
import { PAYMENT_LABELS, PAYMENT_METHODS, newSaleKey, readableTextColor, roundMoney } from "@/lib/pos";
import { formatMoney } from "@/lib/stores";
import { imageThumb } from "@/lib/images";
import { storeThemeCss } from "@/lib/theme";
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

const PAYMENT_ICON = { cash: Banknote, transfer: ArrowLeftRight, other: Wallet };

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
  // The store's accent colour takes over from black: the header bar, selected states and buttons. A store with no
  // accent colour stays black and white. (--primary is what "bg-primary" reads; see lib/theme.js.)
  const accent = /^#[0-9a-fA-F]{6}$/.test(store.accentColor) ? store.accentColor : null;
  const money = (n) => formatMoney(n, store.currency);
  const now = useClock();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const searchRef = useRef(null);

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

  const categories = useMemo(() => {
    const counts = new Map();
    for (const p of products) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, search, category]);

  // Pressing "/" jumps to the search box, like most search-heavy apps.
  useEffect(() => {
    function onKey(e) {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  async function clearSale() {
    const ok = await confirm({
      title: "Clear this sale?",
      description: "Everything in the cart will be removed. To keep it for later, use Hold instead.",
      confirmLabel: "Clear sale",
      destructive: true,
    });
    if (!ok) return;
    setCart({});
    setRestored({});
    setDiscount("");
    setPayment(null);
    setSaleError("");
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
        "The connection is slow or dropped, so we can't tell if this sale went through. Tap Charge again. It will not be charged twice."
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

  const clock = now ? now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";
  const onBar = "text-primary-foreground hover:bg-white/15 hover:text-primary-foreground";

  const searchBox = (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={searchRef}
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products by name or SKU"
        aria-label="Search products"
        className="h-11 border-transparent pl-11 text-base shadow-md md:text-base"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-input bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground lg:block">
        /
      </kbd>
    </div>
  );

  return (
    <div className="store-scope relative flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {accent && <style>{storeThemeCss(accent, readableTextColor(accent))}</style>}

      {/* Header bar: the store's colour, with the search box in the middle */}
      <header className="z-20 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 bg-primary px-4 py-2.5 text-primary-foreground shadow-lg">
        <div className="flex min-w-0 shrink-0 items-center gap-3 md:w-64">
          {store.logoUrl ? (
            <span className="rounded-lg bg-white p-1.5">
              <StoreBrand store={store} className="max-h-8 max-w-40" />
            </span>
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground text-lg font-bold text-primary">
              {store.name.trim().charAt(0).toUpperCase() || "S"}
            </span>
          )}
          <div className="min-w-0 leading-tight">
            <p className="truncate text-base font-bold">{store.name}</p>
            <p className="text-xs text-primary-foreground/70">Point of sale</p>
          </div>
        </div>

        <div className="order-3 w-full md:order-none md:mx-auto md:w-auto md:max-w-xl md:flex-1">{searchBox}</div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {heldOrders.length > 0 && (
            <KTooltip label="Sales you put on hold on this device" side="bottom">
              <Button type="button" variant="secondary" size="sm" onClick={() => setHeldOpen(true)}>
                <Clock />
                Held ({heldOrders.length})
              </Button>
            </KTooltip>
          )}
          <div className="hidden text-right leading-tight sm:block">
            <p className="max-w-36 truncate text-sm font-semibold">{cashierName}</p>
            <p className="text-xs text-primary-foreground/70 tabular-nums">{clock}</p>
          </div>
          <ThemeToggle tipSide="bottom" tipAlign="end" className={onBar} />
          {role === "cashier" ? (
            <KTooltip label="Sign out" side="bottom" align="end">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Sign out" onClick={signOutCashier} className={onBar}>
                <LogOut />
              </Button>
            </KTooltip>
          ) : (
            <KTooltip label="Back to the dashboard" side="bottom" align="end">
              <Button asChild variant="ghost" size="icon-sm" className={onBar}>
                <Link href={`/stores/${store.id}`} aria-label="Back to dashboard">
                  <ArrowLeft />
                </Link>
              </Button>
            </KTooltip>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* LEFT: categories and products */}
        <section className="flex min-w-0 flex-1 flex-col">
          {(categories.length > 0 || products.length > 0) && (
            <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-card px-4 py-3">
              {[["all", products.length], ...categories].map(([c, count]) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    aria-pressed={active}
                    className={cn(
                      "flex h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-150 active:scale-95",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-(--btn-shadow)"
                        : "border-input bg-card text-foreground hover:bg-accent"
                    )}
                  >
                    {c === "all" ? "All" : c}
                    <span
                      className={cn(
                        "rounded-md px-1.5 text-xs tabular-nums",
                        active ? "bg-white/20" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-muted/40 p-4 pb-28 lg:pb-4">
            {products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
                <EmptyIcon icon={ShoppingBag} />
                <p className="text-xl font-bold text-foreground">No products in this store yet</p>
                <p className="text-sm">Add products from the dashboard and they&apos;ll show up here.</p>
              </div>
            ) : visible.length === 0 ? (
              <p className="py-20 text-center text-muted-foreground">No products match your search.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
                      className={cn(
                        "group/product relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                        inCart > 0 ? "border-primary ring-2 ring-primary" : "border-input",
                        out ? "cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
                      )}
                    >
                      {/* The product's picture, or (when it has none) a tile with its initial */}
                      <span
                        className={cn(
                          "relative flex h-28 items-center justify-center overflow-hidden bg-muted text-5xl font-bold text-foreground/20 select-none sm:h-32",
                          out && "opacity-60 grayscale"
                        )}
                      >
                        {p.imageUrl ? (
                          <FadeImage
                            src={imageThumb(p.imageUrl, { w: 480, h: 320 })}
                            alt=""
                            className="size-full object-cover transition-transform duration-300 group-hover/product:scale-105"
                          />
                        ) : (
                          p.name.trim().charAt(0).toUpperCase()
                        )}
                        {low && (
                          <span className="absolute top-2 left-2 rounded-md bg-warning-soft px-1.5 py-0.5 text-[11px] font-bold text-warning-ink">
                            {p.stock} left
                          </span>
                        )}
                        {inCart > 0 && (
                          <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
                            {inCart}
                          </span>
                        )}
                      </span>

                      <span className={cn("flex flex-1 flex-col gap-1 p-3", out && "opacity-50")}>
                        <span className="line-clamp-2 text-sm leading-snug font-semibold">{p.name}</span>
                        <span className="mt-auto flex items-center justify-between pt-1.5">
                          <span className="text-lg font-bold tracking-tight">{money(p.price)}</span>
                          {!out && (
                            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 group-hover/product:scale-110">
                              <Plus className="size-4" strokeWidth={3} />
                            </span>
                          )}
                        </span>
                      </span>

                      {out && (
                        <span className="absolute inset-0 flex items-center justify-center bg-background/55">
                          <span className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">Sold out</span>
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
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card p-3 lg:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex h-14 w-full items-center justify-between rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-(--btn-shadow) transition-transform active:scale-[0.98]"
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

        {/* RIGHT: the cart, or the receipt right after a sale (a fixed panel; a slide-up sheet on phones) */}
        <aside
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex h-[88dvh] flex-col rounded-t-3xl border border-input bg-card shadow-lg transition-transform duration-300",
            cartOpen ? "translate-y-0" : "translate-y-full",
            "lg:static lg:z-auto lg:h-auto lg:w-[380px] lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l-2 lg:border-l-foreground lg:shadow-none"
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
              <header className="flex items-center gap-3 border-b border-border px-5 py-4">
                <h2 className="text-lg font-bold tracking-tight">Current sale</h2>
                {itemCount > 0 && (
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                )}
                {lines.length > 0 && (
                  <KTooltip label="Remove everything from this sale" align="end">
                    <Button type="button" variant="ghost" size="sm" onClick={clearSale} className="ml-auto mr-8 text-muted-foreground lg:mr-0">
                      <Trash2 />
                      Clear
                    </Button>
                  </KTooltip>
                )}
              </header>

              <div className="flex-1 overflow-y-auto px-5">
                {lines.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
                    <EmptyIcon icon={ShoppingBag} size="sm" />
                    <div>
                      <p className="text-base font-bold text-foreground">No items yet</p>
                      <p className="mt-0.5 text-sm">Tap a product to add it to the sale.</p>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {lines.map((l) => (
                      <li key={l.id} className={cn("py-3.5", l.fromHeld && l.problem && "-mx-2 rounded-xl bg-error-soft px-2")}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={cn("text-sm leading-snug font-semibold [overflow-wrap:anywhere]", l.fromHeld && l.problem && "text-error-ink")}>
                              {l.name}
                            </p>
                            {l.product && <p className="text-xs text-muted-foreground">{money(l.product.price)} each</p>}
                          </div>
                          <p className="shrink-0 text-base font-bold">{l.product ? money(roundMoney(l.product.price * l.quantity)) : "-"}</p>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-xl border border-input shadow-(--raised-shadow)">
                            <KTooltip label="One fewer" align="start">
                              <button
                                type="button"
                                onClick={() => changeQuantity(l.id, -1)}
                                disabled={l.quantity <= 1}
                                aria-label="Decrease quantity"
                                className="flex size-10 items-center justify-center rounded-l-xl transition-colors duration-150 hover:bg-accent active:scale-95 disabled:opacity-35"
                              >
                                <Minus className="size-4" />
                              </button>
                            </KTooltip>
                            <span className="w-10 text-center text-base font-bold tabular-nums">{l.quantity}</span>
                            <KTooltip label="One more" align="start">
                              <button
                                type="button"
                                onClick={() => changeQuantity(l.id, 1)}
                                disabled={!l.product || l.quantity >= l.product.stock}
                                aria-label="Increase quantity"
                                className="flex size-10 items-center justify-center rounded-r-xl transition-colors duration-150 hover:bg-accent active:scale-95 disabled:opacity-35"
                              >
                                <Plus className="size-4" />
                              </button>
                            </KTooltip>
                          </div>
                          <KTooltip label="Remove from cart" align="end">
                            <button
                              type="button"
                              onClick={() => removeLine(l.id)}
                              aria-label={`Remove ${l.name}`}
                              className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-error-soft hover:text-error-ink"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </KTooltip>
                        </div>

                        {l.problem && (
                          <p role="alert" className="mt-2 text-xs font-medium text-error-ink">
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

              <footer className="space-y-3.5 border-t-2 border-foreground bg-card px-5 py-4">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-semibold">{money(subtotal)}</dd>
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
                    <p role="alert" className="text-right text-xs font-medium text-error-ink">
                      {discountError}
                    </p>
                  )}
                  <div className="flex items-baseline justify-between pt-1">
                    <dt className="text-base font-bold">Total</dt>
                    <dd className="text-3xl font-bold tracking-tight">{money(total)}</dd>
                  </div>
                </dl>

                <div>
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Paid by</p>
                  <div
                    role="group"
                    aria-label="Payment method"
                    className={cn("grid grid-cols-3 gap-2 rounded-2xl", lines.length > 0 && !payment && "ring-2 ring-warning ring-offset-2 ring-offset-card")}
                  >
                    {PAYMENT_METHODS.map((m) => {
                      const active = payment === m;
                      const Icon = PAYMENT_ICON[m] ?? Wallet;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayment(m)}
                          aria-pressed={active}
                          className={cn(
                            "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs font-bold transition-all duration-150 active:scale-95",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-(--btn-shadow)"
                              : "border-input bg-card text-foreground hover:bg-accent"
                          )}
                        >
                          <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                          {PAYMENT_LABELS[m]}
                        </button>
                      );
                    })}
                  </div>
                  {lines.length > 0 && !payment && (
                    <p className="mt-2 text-center text-sm font-semibold text-warning-ink">Choose how the customer is paying</p>
                  )}
                </div>

                {saleError && <FormError>{saleError}</FormError>}

                <div className="flex gap-2">
                  {lines.length > 0 && (
                    <KTooltip label="Save this sale for later and start a new one">
                      <Button type="button" variant="secondary" size="lg" className="h-14 px-4" onClick={holdSale} aria-label="Hold sale">
                        <Pause />
                        <span className="hidden xl:inline">Hold</span>
                        <span className="sr-only xl:hidden">Hold Sale</span>
                      </Button>
                    </KTooltip>
                  )}
                  <Button type="button" size="lg" disabled={!canComplete} onClick={() => setConfirmOpen(true)} className="h-14 flex-1 text-base font-bold">
                    {lines.length > 0 ? `Charge ${money(total)}` : "Charge"}
                  </Button>
                </div>
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
                      <Button type="button" onClick={() => restoreHeld(order)}>
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
              <dd className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">{PAYMENT_LABELS[payment]}</dd>
            </div>
          </dl>

          <p className="py-1 text-center text-4xl font-bold tracking-tight">{money(total)}</p>

          <DialogFooter>
            <Button type="button" variant="secondary" size="lg" disabled={submitting} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="lg" loading={submitting} onClick={submitSale}>
              {submitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}
