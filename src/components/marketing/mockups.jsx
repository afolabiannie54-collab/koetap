import { Check, Plus, Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

// Everything on the marketing pages that looks like the product is drawn here in HTML and CSS (no screenshots), so it
// stays sharp at any size, follows light and dark mode, and costs nothing to load. All of it is decoration:
// it is hidden from screen readers.

export function BrowserFrame({ url, className, children }) {
  return (
    <div aria-hidden="true" className={cn("overflow-hidden rounded-3xl border-2 border-foreground bg-background shadow-[10px_10px_0_0_var(--foreground)] select-none", className)}>
      <div className="flex items-center gap-3 border-b-2 border-foreground bg-background px-4 py-3">
        <span className="flex gap-1.5">
          <i className="size-3 rounded-full border-2 border-foreground" />
          <i className="size-3 rounded-full border-2 border-foreground" />
          <i className="size-3 rounded-full bg-foreground" />
        </span>
        <span className="mx-auto max-w-xs flex-1 truncate rounded-lg border-2 border-foreground/15 px-3 py-1 text-center text-xs font-semibold text-muted-foreground">{url}</span>
        <span className="w-12" />
      </div>
      {children}
    </div>
  );
}

const PRODUCTS = [
  ["Ankara dress", "₦18,500", "A"],
  ["Leather sandals", "₦9,200", "L"],
  ["Gele headwrap", "₦4,500", "G"],
  ["Lace fabric", "₦12,000", "L"],
  ["Beaded necklace", "₦3,800", "B"],
  ["Tote bag", "₦7,600", "T"],
];

const CART = [
  ["Ankara dress", "1", "₦18,500"],
  ["Gele headwrap", "2", "₦9,000"],
  ["Tote bag", "1", "₦7,600"],
];

// The POS screen: header bar, product grid, and the cart with its Charge button.
export function PosMock({ cart = true, compact = false, className }) {
  return (
    <div aria-hidden="true" className={cn("bg-background text-foreground", className)}>
      <div className="flex items-center gap-3 bg-foreground px-4 py-3 text-background">
        <span className="flex size-8 items-center justify-center rounded-lg bg-background text-sm font-bold text-foreground">K</span>
        <span className="text-sm font-bold">Kemi&apos;s Fashion</span>
        <span className="ml-auto hidden items-center gap-2 rounded-lg bg-background/15 px-3 py-1.5 text-xs text-background/70 sm:flex">
          <Search className="size-3.5" />
          Search products
        </span>
        <span className="ml-auto text-xs text-background/60 sm:ml-0">Point of sale</span>
      </div>

      <div className={cn("grid", cart ? "grid-cols-[1fr] sm:grid-cols-[1.6fr_1fr]" : "grid-cols-1")}>
        <div className={cn("grid gap-3 p-4", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
          {PRODUCTS.slice(0, compact ? 4 : 6).map(([n, p, l]) => (
            <div key={n} className="overflow-hidden rounded-xl border-2 border-foreground/15">
              <div className="flex h-14 items-center justify-center bg-muted text-2xl font-bold text-foreground/25 sm:h-16">{l}</div>
              <div className="flex items-center justify-between gap-1 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold sm:text-xs">{n}</p>
                  <p className="text-xs font-bold sm:text-sm">{p}</p>
                </div>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Plus className="size-3.5" strokeWidth={3} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {cart && (
          <div className="hidden flex-col border-l-2 border-foreground/15 p-4 sm:flex">
            <p className="flex items-center gap-2 text-sm font-bold">
              <ShoppingBag className="size-4" />
              Current sale
            </p>
            <ul className="mt-3 flex-1 divide-y divide-border text-xs">
              {CART.map(([n, q, t]) => (
                <li key={n} className="flex items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0 truncate font-semibold">
                    {n} <span className="text-muted-foreground">×{q}</span>
                  </span>
                  <span className="font-bold">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t-2 border-foreground pt-3 text-sm font-bold">
              <span>Total</span>
              <span className="text-base">₦35,100</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
              <span className="rounded-lg bg-foreground py-1.5 text-background">Cash</span>
              <span className="rounded-lg border-2 border-foreground/20 py-1.5">Transfer</span>
              <span className="rounded-lg border-2 border-foreground/20 py-1.5">Other</span>
            </div>
            <span className="mt-3 rounded-xl bg-foreground py-3 text-center text-sm font-bold text-background">Charge ₦35,100</span>
          </div>
        )}
      </div>
    </div>
  );
}

const field = "rounded-xl border-2 border-foreground/20 px-3 py-2.5 text-sm text-muted-foreground";
const label = "mb-1.5 block text-xs font-bold";

export function RegisterMock() {
  return (
    <BrowserFrame url="koetap.com/register">
      <div aria-hidden="true" className="space-y-4 p-7 sm:p-9">
        <p className="text-2xl font-bold tracking-tight">Create your account</p>
        <span className="flex items-center justify-center gap-2 rounded-xl border-2 border-foreground py-2.5 text-sm font-bold">
          <span className="font-bold">G</span> Continue with Google
        </span>
        <p className="text-center text-xs text-muted-foreground">or with your email</p>
        <div>
          <span className={label}>Business name</span>
          <div className={field}>Kemi&apos;s Fashion Store</div>
        </div>
        <div>
          <span className={label}>Email</span>
          <div className={field}>kemi@example.com</div>
        </div>
        <span className="block rounded-xl bg-foreground py-3 text-center text-sm font-bold text-background">Create account</span>
      </div>
    </BrowserFrame>
  );
}

const SWATCH = ["#0A0A0A", "#2563EB", "#16A34A", "#D97706", "#DC2626", "#DB2777", "#0891B2"];

export function WizardMock() {
  return (
    <BrowserFrame url="koetap.com/dashboard">
      <div aria-hidden="true" className="p-6 sm:p-8">
        <div className="flex items-center justify-center gap-2 text-xs font-bold">
          <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-3.5" strokeWidth={3} /></span>
          <span className="h-0.5 w-8 bg-foreground" />
          <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-background ring-4 ring-foreground/15">2</span>
          <span className="h-0.5 w-8 bg-border" />
          <span className="flex size-7 items-center justify-center rounded-full border-2 border-foreground/25 text-muted-foreground">3</span>
        </div>
        <p className="mt-6 text-2xl font-bold tracking-tight">Make it yours</p>
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-5">
          <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-foreground/30 text-[11px] font-semibold text-muted-foreground">Logo</div>
          <div>
            <span className={label}>Brand colour</span>
            <div className="flex flex-wrap gap-2">
              {SWATCH.map((c, i) => (
                <span key={c} style={{ background: c }} className={cn("size-7 rounded-full", i === 3 && "ring-2 ring-foreground ring-offset-2 ring-offset-background")} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border-2 border-foreground/15">
          <div style={{ background: SWATCH[3] }} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white">
            <span className="flex size-5 items-center justify-center rounded bg-white text-[10px]" style={{ color: SWATCH[3] }}>K</span>
            Kemi&apos;s Fashion
          </div>
          <div className="flex items-center justify-between p-3 text-xs">
            <span className="font-semibold">Ankara dress · ₦18,500</span>
            <span style={{ background: SWATCH[3] }} className="rounded-lg px-3 py-1.5 font-bold text-white">Charge</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

export function CashierMock() {
  return (
    <BrowserFrame url="koetap.com/stores/…/staff">
      <div aria-hidden="true" className="p-6 sm:p-8">
        <div className="mx-auto max-w-sm rounded-2xl border-2 border-foreground p-5">
          <p className="text-lg font-bold tracking-tight">Add cashier</p>
          <div className="mt-4 space-y-3">
            <div>
              <span className={label}>Full name</span>
              <div className={field}>Tunde Bakare</div>
            </div>
            <div>
              <span className={label}>Email</span>
              <div className={field}>tunde@example.com</div>
            </div>
            <div>
              <span className={label}>Password</span>
              <div className={field}>••••••••••</div>
            </div>
          </div>
          <span className="mt-5 block rounded-xl bg-foreground py-2.5 text-center text-sm font-bold text-background">Add cashier</span>
        </div>
        <ul className="mx-auto mt-4 max-w-sm divide-y divide-border rounded-2xl border-2 border-foreground/15 text-sm">
          {[["Amaka Obi", "Active"], ["Tunde Bakare", "Active"]].map(([n, s]) => (
            <li key={n} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{n[0]}</span>
              <span className="flex-1 font-semibold">{n}</span>
              <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-bold text-success-ink">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </BrowserFrame>
  );
}

// Small illustrations for the feature tiles

export function StoresVisual() {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      {[["Victoria Island", "12 products"], ["Ikeja", "48 products"], ["Lekki", "31 products"]].map(([n, c], i) => (
        <div key={n} className={cn("flex items-center gap-3 rounded-2xl border-2 px-4 py-3", i === 0 ? "border-background bg-background text-foreground" : "border-background/25 text-background")}>
          <span className={cn("flex size-10 items-center justify-center rounded-xl text-base font-bold", i === 0 ? "bg-foreground text-background" : "bg-background/15")}>{n[0]}</span>
          <span className="flex-1 text-base font-bold">{n}</span>
          <span className={cn("text-sm", i === 0 ? "text-muted-foreground" : "text-background/60")}>{c}</span>
        </div>
      ))}
    </div>
  );
}

export function StockVisual() {
  return (
    <div aria-hidden="true" className="space-y-3.5">
      {[["Ankara dress", 82, false], ["Leather sandals", 46, false], ["Gele headwrap", 12, true]].map(([n, v, low]) => (
        <div key={n}>
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
            <span>{n}</span>
            {low ? <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs text-background">3 left</span> : <span className="text-muted-foreground">{v} in stock</span>}
          </div>
          <div className="h-3 overflow-hidden rounded-full border-2 border-foreground">
            <div className="h-full bg-foreground" style={{ width: `${v}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StaffVisual() {
  return (
    <div aria-hidden="true" className="flex -space-x-3">
      {["A", "T", "K", "O"].map((l, i) => (
        <span key={l} className={cn("flex size-14 items-center justify-center rounded-full border-4 border-background text-xl font-bold", i % 2 ? "bg-background text-foreground ring-2 ring-foreground" : "bg-foreground text-background")}>
          {l}
        </span>
      ))}
    </div>
  );
}

export function ReportsVisual() {
  const bars = [38, 62, 45, 80, 58, 96, 70];
  return (
    <div aria-hidden="true" className="flex h-28 items-end gap-2.5">
      {bars.map((h, i) => (
        <span key={i} style={{ height: `${h}%` }} className={cn("flex-1 rounded-t-lg", i === 5 ? "bg-foreground" : "bg-foreground/20")} />
      ))}
    </div>
  );
}

export function ReceiptVisual() {
  return (
    <div aria-hidden="true" className="receipt-paper mx-auto w-44 rotate-2 rounded-lg border-2 border-foreground p-4 text-center text-[11px] shadow-[5px_5px_0_0_var(--foreground)]">
      <p className="text-sm font-bold">Kemi&apos;s Fashion</p>
      <div className="my-2 border-t border-dashed" />
      <div className="flex justify-between"><span>Ankara dress</span><span className="font-bold">₦18,500</span></div>
      <div className="flex justify-between"><span>Tote bag</span><span className="font-bold">₦7,600</span></div>
      <div className="my-2 border-t border-dashed" />
      <div className="flex justify-between text-xs font-bold"><span>Total</span><span>₦26,100</span></div>
      <p className="receipt-muted mt-3">Thank you for shopping with us!</p>
    </div>
  );
}

export function BrandVisual() {
  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-3">
      {SWATCH.map((c) => (
        <span key={c} style={{ background: c }} className="size-12 rounded-2xl shadow-md sm:size-16" />
      ))}
    </div>
  );
}
