"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, LogOut, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptView, StoreBrand } from "@/components/pos/receipt-view";
import { PAYMENT_LABELS, PAYMENT_METHODS, readableTextColor, roundMoney } from "@/lib/pos";
import { formatMoney } from "@/lib/stores";
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
  const [payment, setPayment] = useState("cash");
  const [cartOpen, setCartOpen] = useState(false); // the bottom sheet on small screens
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [receipt, setReceipt] = useState(null);

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
    setSubmitting(true);
    setSaleError("");

    let res;
    let data = {};
    try {
      res = await fetch(`/api/pos/${store.id}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Prices are not sent: the server charges the product's current price.
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.id, quantity: l.quantity })),
          paymentMethod: payment,
          discount: discountValue,
        }),
      });
      data = await res.json().catch(() => ({}));
    } catch {
      res = null;
    }
    setSubmitting(false);
    setConfirmOpen(false);

    if (!res || !res.ok) {
      // The cart stays exactly as it was so the cashier can fix it.
      setSaleError(
        !res ? "Couldn't reach the server. Check your connection and try again." : data.error || "Could not complete the sale"
      );
      if (res) refreshProducts(); // stock may have changed under us
      return;
    }

    setReceipt(data.sale);
    setCart({});
    setDiscount("");
    setCartOpen(false);
    refreshProducts();
  }

  function startNewSale() {
    setReceipt(null);
    setSaleError("");
    setPayment("cash");
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
          <div className="ml-auto text-right text-xs text-gray-500 lg:hidden">
            <p className="font-medium text-gray-700">{cashierName}</p>
            <p>{now ? now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
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
                onClick={() => signOut({ callbackUrl: "/login" })}
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
                <li key={l.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{l.product?.name ?? "Unavailable product"}</p>
                      {l.product && <p className="text-xs text-gray-500">{money(l.product.price)} each</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.id)}
                      aria-label={`Remove ${l.product?.name ?? "item"}`}
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
                      {l.problem}. Reduce the quantity or remove it.
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

          <div role="group" aria-label="Payment method" className="grid grid-cols-3 gap-2">
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

          {saleError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {saleError}
            </p>
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

      <Dialog open={confirmOpen} onOpenChange={(open) => !submitting && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm sale</DialogTitle>
            <DialogDescription>
              {itemCount} {itemCount === 1 ? "item" : "items"} paid by {PAYMENT_LABELS[payment]}.
            </DialogDescription>
          </DialogHeader>
          <p className="py-2 text-center text-4xl font-bold">{money(total)}</p>
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
