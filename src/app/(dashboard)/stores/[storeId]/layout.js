import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { getStorePageData } from "@/lib/store-page";
import { StoreTabs } from "@/components/dashboard/store-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Store | Koetap" };

export default async function StoreLayout({ children, params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/stores">
          <ArrowLeft data-icon="inline-start" />
          Back to stores
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
            <Badge variant={store.isActive ? "default" : "secondary"}>
              {store.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{store.address || "No address set"}</p>
        </div>
        <Button asChild>
          <Link href={`/pos/${store.id}`}>
            <ShoppingCart data-icon="inline-start" />
            Open POS
          </Link>
        </Button>
      </div>

      <StoreTabs storeId={store.id} />

      <div>{children}</div>
    </div>
  );
}
