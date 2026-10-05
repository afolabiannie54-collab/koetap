import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingCart } from "lucide-react";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { getStorePageData } from "@/lib/store-page";
import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { TopBarActions } from "@/components/dashboard/topbar";
import { StoreTabs } from "@/components/dashboard/store-tabs";
import { Button } from "@/components/ui/button";
import { KBadge } from "@/components/ui/koetap/KBadge";

export const metadata = { title: "Store | Koetap" };

export default async function StoreLayout({ children, params }) {
  const { storeId } = await params;
  const { user, store } = await getStorePageData(storeId);

  // An owner with a single store never sees the stores list (it redirects here), so this page is where
  // they add another store, and there is no "All stores" to go back to.
  await connectDB();
  const onlyStore = (await Store.countDocuments(businessFilter(user))) === 1;

  return (
    <div className="space-y-6">
      {onlyStore ? (
        <TopBarActions>
          <AddStoreDialog variant="outline" />
        </TopBarActions>
      ) : (
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link href="/stores">
            <ArrowLeft />
            All stores
          </Link>
        </Button>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{store.name}</h1>
            <KBadge variant={store.isActive ? "active" : "inactive"}>{store.isActive ? "Active" : "Inactive"}</KBadge>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {store.address || "No address set"}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href={`/pos/${store.id}`}>
            <ShoppingCart />
            Open POS
          </Link>
        </Button>
      </div>

      <StoreTabs storeId={store.id} />

      <div className="pt-2">{children}</div>
    </div>
  );
}
