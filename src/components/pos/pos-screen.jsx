"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, Clock, LogOut, Minus, Pause, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptView, StoreBrand } from "@/components/pos/receipt-view";
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

const DEFAULT_ACCENT = "#4f46e5";

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
  const accent = /^#[0-9a-fA-F]{6}$/.test(store.accentColor) ? store.accentColor : DEFAULT_ACCENT;
  const accentFg = readableTextColor(accent);
  const money = (n) => formatMoney(n, store.currency);
  const now = useClock();

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
  const heldRaw = useSyncExternalStore(
    subscribeHeld,
    () => readHeldRaw(store.id),
    serverHeldRaw
  );
  const heldOrders = useMemo(() => parseHeld(heldRaw), [heldRaw]);
  const [heldOpen, setHeldOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
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

  function addToCart(p) {
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
    setCartOpen(false);
    refreshProducts();
  }

  function startNewSale() {
    setReceipt(null);
    setSaleError("");
    setPayment(null);
  }

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
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
      showToast("Could not hold the sale: this browser blocked storage");
      return;
    }

    setCart({});
    setRestored({});
    setDiscount("");
    setPayment(null);
    setSaleError("");
    setCartOpen(false);
    showToast("Sale held");
  }

  function restoreHeld(order) {
    if (lines.length > 0 && !window.confirm("This will replace your current cart. Continue?")) return;

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

  function discardHeld(order) {
    if (!window.confirm("Discard this held order?")) return;
    removeHeldOrder(store.id, order.id);
  }

  function signOutCashier() {
    clearAllHeldOrders();
    signOut({ callbackUrl: "/login" });
  }

  const rootStyle = { "--accent": accent, "--accent-fg": accentFg };

  if (receipt) {
    return (
      <div style={rootStyle}>
        <ReceiptView sale={receipt} store={store} accent={accent} accentFg={accentFg} onNewSale={startNewSale} />
      </div>
    );
  }

  return (
    <div style={rootStyle} className="relative flex h-dvh overflow-hidden bg-gray-100 text-gray-900">
      {/* LEFT: products */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <StoreBrand store={store} className="text-xl" />
          {store.logoUrl && <span className="truncate text-lg font-bold">{store.name}</span>}
          <div className="ml-auto flex items-center gap-3">
            {heldOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setHeldOpen(true)}
                className="flex h-10 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 text-sm font-semibold text-gray-700 active:scale-[0.97]"
              >
                <Clock className="size-4" />
                Held ({heldOrders.length})
              </button>
            )}
            <div className="text-right text-xs text-gray-500 lg:hidden">
              <p className="font-medium text-gray-700">{cashierName}</p>
              <p>{now ? now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
            </div>
          </div>
        </header>

        <div className="space-y-3 border-b bg-white px-4 pt-3 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-12 w-full rounded-xl border border-gray-300 bg-gray-50 pr-3 pl-10 text-base outline-none focus:border-[var(--accent)] focus:bg-white"
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
                  style={active ? { background: accent, color: accentFg } : undefined}
                  className={cn(
                    "h-10 shrink-0 rounded-full border px-4 text-sm font-medium",
                    active ? "border-transparent" : "border-gray-300 bg-white text-gray-700"
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
            <p className="py-16 text-center text-gray-500">No products in this store yet.</p>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-gray-500">No products match your search.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((p) => {
                const out = p.stock <= 0;
                const inCart = cart[p._id] ?? 0;
                return (
                  <button
                    key={p._id}
                    type="button"
                    disabled={out}
                    onClick={() => addToCart(p)}
                    className={cn(
                      "relative flex min-h-32 flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.97]",
                      out
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "border-gray-200 hover:border-[var(--accent)] hover:shadow-md",
                      inCart > 0 && "border-[var(--accent)] ring-2 ring-[var(--accent)]"
                    )}
                  >
                    {inCart > 0 && (
                      <span
                        style={{ background: accent, color: accentFg }}
                        className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full text-sm font-bold shadow"
                      >
                        {inCart}
                      </span>
                    )}
                    <span className="line-clamp-2 text-base leading-snug font-semibold">{p.name}</span>
                    <span>
                      <span className={cn("block text-lg font-bold", !out && "text-[var(--accent)]")}>{money(p.price)}</span>
                      <span className="block text-xs">{out ? "Out of stock" : `${p.stock} in stock`}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Mobile: bar that opens the cart */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white p-3 lg:hidden">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          style={{ background: accent, color: accentFg }}
          className="flex h-14 w-full items-center justify-between rounded-xl px-5 text-base font-semibold"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            {itemCount === 0 ? "Cart is empty" : `View cart (${itemCount})`}
          </span>
          <span>{money(total)}</span>
        </button>
      </div>

      {cartOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setCartOpen(false)} aria-hidden="true" />}

      {/* RIGHT: cart (fixed panel on desktop, slide-up sheet on mobile) */}
      <aside
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex h-[88dvh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300",
          cartOpen ? "translate-y-0" : "translate-y-full",
          "lg:static lg:z-auto lg:h-auto lg:w-[26rem] lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-l lg:shadow-none"
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{cashierName}</p>
            <p className="text-xs text-gray-500" suppressHydrationWarning>
              {now
                ? `${now.toLocaleDateString("en-NG", { dateStyle: "medium" })} · ${now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "--"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {role === "cashier" ? (
              <button
                type="button"
                onClick={signOutCashier}
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            ) : (
              <Link
                href={`/stores/${store.id}`}
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="size-4" />
                Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="Close cart"
              className="flex size-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
              <ShoppingCart className="size-10" />
              <p className="text-sm">No items added yet</p>
            </div>
          ) : (
            <ul className="divide-y">
              {lines.map((l) => (
                <li key={l.id} className={cn("py-3", l.fromHeld && l.problem && "-mx-2 rounded-xl bg-red-50 px-2")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-semibold", l.fromHeld && l.problem && "text-red-700")}>{l.name}</p>
                      {l.product && <p className="text-xs text-gray-500">{money(l.product.price)} each</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.id)}
                      aria-label={`Remove ${l.name}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
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
                        className="flex size-10 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-10 text-center text-base font-semibold">{l.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(l.id, 1)}
                        disabled={!l.product || l.quantity >= l.product.stock}
                        aria-label="Increase quantity"
                        className="flex size-10 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <p className="text-base font-bold">{l.product ? money(roundMoney(l.product.price * l.quantity)) : "-"}</p>
                  </div>
                  {l.problem && (
                    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
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

        <footer className="space-y-3 border-t bg-white px-4 py-3">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium">{money(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">
                <label htmlFor="discount">Discount</label>
              </dt>
              <dd>
                <input
                  id="discount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  aria-invalid={Boolean(discountError)}
                  className="h-9 w-28 rounded-lg border border-gray-300 px-2 text-right text-sm outline-none focus:border-[var(--accent)]"
                />
              </dd>
            </div>
            {discountError && lines.length > 0 && (
              <p role="alert" className="text-right text-xs text-red-600">
                {discountError}
              </p>
            )}
            <div className="flex justify-between border-t pt-2 text-xl font-bold">
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>

          <div
            role="group"
            aria-label="Payment method"
            className={cn(
              "grid grid-cols-3 gap-2 rounded-2xl",
              lines.length > 0 && !payment && "ring-2 ring-amber-400 ring-offset-2"
            )}
          >
            {PAYMENT_METHODS.map((m) => {
              const active = payment === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayment(m)}
                  aria-pressed={active}
                  style={active ? { background: accent, color: accentFg } : undefined}
                  className={cn(
                    "h-12 rounded-xl border text-sm font-semibold",
                    active ? "border-transparent" : "border-gray-300 bg-white text-gray-700"
                  )}
                >
                  {PAYMENT_LABELS[m]}
                </button>
              );
            })}
          </div>

          {lines.length > 0 && !payment && (
            <p className="text-center text-sm font-medium text-amber-700">Choose how the customer is paying</p>
          )}

          {saleError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {saleError}
            </p>
          )}

          {lines.length > 0 && (
            <button
              type="button"
              onClick={holdSale}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white text-base font-semibold text-gray-700 active:scale-[0.99]"
            >
              <Pause className="size-4" />
              Hold Sale
            </button>
          )}

          <button
            type="button"
            disabled={!canComplete}
            onClick={() => setConfirmOpen(true)}
            style={{ background: accent, color: accentFg }}
            className="h-16 w-full rounded-2xl text-lg font-bold shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Complete Sale{lines.length > 0 && ` · ${money(total)}`}
          </button>
        </footer>
      </aside>

      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </div>
      )}

      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Held orders</DialogTitle>
            <DialogDescription>Saved on this device. Restore one to carry on with that sale.</DialogDescription>
          </DialogHeader>

          {heldOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No held orders.</p>
          ) : (
            <ul className="max-h-[60dvh] space-y-3 overflow-y-auto">
              {[...heldOrders].reverse().map((order) => {
                const count = order.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <li key={order.id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          Held {timeAgo(order.heldAt, now ?? new Date(order.heldAt))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {count} {count === 1 ? "item" : "items"}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-bold">{money(heldOrderTotal(order))}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => restoreHeld(order)}
                        style={{ background: accent, color: accentFg }}
                        className="h-11 rounded-xl text-sm font-bold"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => discardHeld(order)}
                        className="h-11 rounded-xl border border-gray-300 text-sm font-semibold text-red-600"
                      >
                        Discard
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={(open) => !submitting && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm sale</DialogTitle>
            <DialogDescription>Check the items and the payment method before you confirm.</DialogDescription>
          </DialogHeader>

          <ul className="max-h-[40dvh] divide-y overflow-y-auto rounded-xl border border-gray-200 px-3" aria-label="Items in this sale">
            {lines.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-gray-500"> × {l.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">
                  {l.product ? money(roundMoney(l.product.price * l.quantity)) : "-"}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-gray-600">
                <dt>Discount</dt>
                <dd>-{money(discountValue)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <dt className="text-gray-600">Paid by</dt>
              <dd
                style={{ background: accent, color: accentFg }}
                className="rounded-full px-3 py-1 text-sm font-bold"
              >
                {PAYMENT_LABELS[payment]}
              </dd>
            </div>
          </dl>

          <p className="py-1 text-center text-4xl font-bold">{money(total)}</p>
          <DialogFooter>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirmOpen(false)}
              className="h-12 rounded-xl border border-gray-300 px-5 text-sm font-semibold disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submitSale}
              style={{ background: accent, color: accentFg }}
              className="h-12 rounded-xl px-6 text-sm font-bold disabled:opacity-60"
            >
              {submitting ? "Processing..." : "Confirm"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
