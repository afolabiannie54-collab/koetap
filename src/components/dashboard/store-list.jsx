import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { FadeImage } from "@/components/ui/koetap/fade-image";
import { KBadge } from "@/components/ui/koetap/KBadge";
import { imageThumb } from "@/lib/images";
import { readableTextColor } from "@/lib/pos";

// The stores as one list on one surface: a row per store that opens it. Replaces a card per store, which
// felt empty with one store. `hrefFor` / `hint` let the reports page reuse it to open a store's reports.
export function StoreList({ stores, counts, hrefFor = (s) => `/stores/${s.id}`, hint = "Open store" }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {stores.map((store) => {
        const c = counts?.[store.id];
        return (
          <li key={store.id}>
            <Link
              href={hrefFor(store)}
              className="group/row flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-accent focus-visible:relative focus-visible:z-10"
            >
              <StoreTile store={store} />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="text-base font-semibold tracking-tight [overflow-wrap:anywhere]">{store.name}</span>
                  <KBadge variant={store.isActive ? "active" : "inactive"}>{store.isActive ? "Active" : "Inactive"}</KBadge>
                </span>
                {store.address && (
                  <span className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="[overflow-wrap:anywhere]">{store.address}</span>
                  </span>
                )}
              </span>

              {c && (
                <span className="hidden shrink-0 text-right text-sm text-muted-foreground sm:block">
                  <span className="block">
                    {c.products} {c.products === 1 ? "product" : "products"}
                  </span>
                  <span className="block">
                    {c.cashiers} {c.cashiers === 1 ? "cashier" : "cashiers"}
                  </span>
                </span>
              )}

              <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover/row:text-foreground">
                <span className="hidden md:inline">{hint}</span>
                <ArrowUpRight className="size-5 transition-transform duration-150 group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// The store's own mark: its logo if it has one (whole, uncropped), otherwise its initial on its accent colour.
// A store with no accent colour stays black and white.
function StoreTile({ store }) {
  if (store.logoUrl) {
    return (
      <FadeImage
        src={imageThumb(store.logoUrl, { w: 132, h: 132, fit: "limit" })}
        alt=""
        className="size-11 shrink-0 rounded-xl border border-border bg-white object-contain p-1"
      />
    );
  }
  const accent = /^#[0-9a-fA-F]{6}$/.test(store.accentColor) ? store.accentColor : null;
  return (
    <span
      aria-hidden="true"
      style={accent ? { background: accent, color: readableTextColor(accent) } : undefined}
      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-base font-bold text-background"
    >
      {store.name.trim().charAt(0).toUpperCase() || "S"}
    </span>
  );
}
