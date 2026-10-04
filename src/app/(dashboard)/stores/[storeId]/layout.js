import Link from "next/link";
import { ArrowLeft, MapPin, ShoppingCart } from "lucide-react";
import { getStorePageData } from "@/lib/store-page";
import { StoreTabs } from "@/components/dashboard/store-tabs";
import { Button } from "@/components/ui/button";
import { KBadge } from "@/components/ui/koetap/KBadge";

export const metadata = { title: "Store | Koetap" };

export default async function StoreLayout({ children, params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
        <Link href="/stores">
          <ArrowLeft />
          All stores
        </Link>
      </Button>

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
