import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { getStorePageData } from "@/lib/store-page";
import { readableTextColor } from "@/lib/pos";
import { storeThemeCss } from "@/lib/theme";
import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { TopBarActions } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import { KBadge } from "@/components/ui/koetap/KBadge";
import { Skeleton } from "@/components/ui/skeleton";

// The parts of a store's page header that need the store loaded from the database. The layout wraps each in
// <Suspense>, so the tabs and buttons around them show immediately and only these fill in.

// Sets the theme colour for everything inside the store scope to the store's accent colour (when it has one).
export async function StoreTheme({ storeId }) {
  const { store } = await getStorePageData(storeId);
  if (!/^#[0-9a-fA-F]{6}$/.test(store.accentColor)) return null;
  return <style>{storeThemeCss(store.accentColor, readableTextColor(store.accentColor))}</style>;
}

// "All stores" link, or (for an owner with a single store, who never sees the list) an Add Store button in the top bar.
export async function StoreBackLink({ storeId }) {
  const { user } = await getStorePageData(storeId);
  await connectDB();
  const onlyStore = (await Store.countDocuments(businessFilter(user))) === 1;

  if (onlyStore) {
    return (
      <TopBarActions>
        <AddStoreDialog variant="outline" />
      </TopBarActions>
    );
  }
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
      <Link href="/stores">
        <ArrowLeft />
        All stores
      </Link>
    </Button>
  );
}

// The store's tile (in its accent colour), name, status and address.
export async function StoreIdentity({ storeId }) {
  const { store } = await getStorePageData(storeId);
  const accent = /^#[0-9a-fA-F]{6}$/.test(store.accentColor) ? store.accentColor : null;

  return (
    <div className="flex min-w-0 items-center gap-4">
      <span
        aria-hidden="true"
        style={accent ? { background: accent, color: readableTextColor(accent) } : undefined}
        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-md"
      >
        {store.name.trim().charAt(0).toUpperCase() || "S"}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{store.name}</h1>
          <KBadge variant={store.isActive ? "active" : "inactive"}>{store.isActive ? "Active" : "Inactive"}</KBadge>
        </div>
        {store.address && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {store.address}
          </p>
        )}
      </div>
    </div>
  );
}

export function StoreIdentitySkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-14 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
