import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getStorePageData } from "@/lib/store-page";
import { readableTextColor } from "@/lib/pos";
import { storeAccentCss, storeThemeCss } from "@/lib/theme";
import { CrumbSection } from "@/components/store/crumb-section";
import { KBadge } from "@/components/ui/koetap/KBadge";
import { Skeleton } from "@/components/ui/skeleton";

// The pieces of the store environment that need the store loaded from the database. The layout wraps each one in
// <Suspense>, so the navigation links and buttons show straight away and only these fill in.

const validAccent = (color) => (/^#[0-9a-fA-F]{6}$/.test(color) ? color : null);

// Sets the accent colour for the whole environment (see storeAccentCss).
export async function StoreAccentStyle({ storeId }) {
  const { store } = await getStorePageData(storeId);
  const accent = validAccent(store.accentColor);
  if (!accent) return null;
  const readable = readableTextColor(accent);
  // The accent colour for the Open POS button, section marker and logo tile, plus primary buttons and table headers
  return <style>{storeAccentCss(accent, readable) + storeThemeCss(accent, readable, ".store-env")}</style>;
}

// The store's logo slot: its logo if it has one, otherwise its initial on the accent colour.
// (Logo upload isn't built yet. When it is, an uploaded logo lands in store.logoUrl and shows here, in the POS
// header and on receipts without any further change.)
export async function StoreLogoSlot({ storeId }) {
  const { store } = await getStorePageData(storeId);

  return store.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- logo URLs are arbitrary external images
    <img src={store.logoUrl} alt="" className="size-11 shrink-0 rounded-xl border border-border object-cover" />
  ) : (
    <span
      aria-hidden="true"
      style={{ background: "var(--store-accent, var(--foreground))", color: "var(--store-accent-fg, var(--background))" }}
      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold shadow-sm"
    >
      {store.name.trim().charAt(0).toUpperCase() || "S"}
    </span>
  );
}

export async function StoreNameText({ storeId }) {
  const { store } = await getStorePageData(storeId);
  return <p className="truncate text-base font-bold tracking-tight">{store.name}</p>;
}

export function StoreLogoSlotSkeleton() {
  return <Skeleton className="size-11 shrink-0 rounded-xl" />;
}

export function StoreNameSkeleton() {
  return <Skeleton className="h-5 w-28" />;
}

export async function StoreNavStatus({ storeId }) {
  const { store } = await getStorePageData(storeId);
  return <KBadge variant={store.isActive ? "active" : "inactive"}>{store.isActive ? "Active" : "Inactive"}</KBadge>;
}

// Koetap › Store name › Section. Koetap goes back to the dashboard, the store name to the store's overview.
export async function StoreBreadcrumb({ storeId }) {
  const { store } = await getStorePageData(storeId);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/dashboard" className="transition-colors duration-150 hover:text-foreground hover:underline">
        Koetap
      </Link>
      <ChevronRight className="size-3.5" />
      <Link href={`/stores/${store.id}`} className="max-w-48 truncate transition-colors duration-150 hover:text-foreground hover:underline">
        {store.name}
      </Link>
      <CrumbSection storeId={store.id} />
    </nav>
  );
}
