import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { StoreBackLink, StoreIdentity, StoreIdentitySkeleton, StoreTheme } from "@/components/dashboard/store-header";
import { StoreTabs } from "@/components/dashboard/store-tabs";
import { Button } from "@/components/ui/button";
import { KTooltip } from "@/components/ui/koetap/tooltip";

export const metadata = { title: "Store | Koetap" };

// The store's page frame: its identity and Open POS button, with the section tabs attached underneath, all
// on one raised panel. Only the identity (name, status, address) needs the database, so it alone waits
// inside <Suspense>; the button and the tabs come from the URL and are there straight away.
export default async function StoreLayout({ children, params }) {
  const { storeId } = await params;

  return (
    // store-scope: if the store has an accent colour, everything inside is coloured by it (see lib/theme.js)
    <div className="store-scope space-y-6">
      <Suspense fallback={null}>
        <StoreTheme storeId={storeId} />
      </Suspense>
      <Suspense fallback={<div className="h-9" />}>
        <StoreBackLink storeId={storeId} />
      </Suspense>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <Suspense fallback={<StoreIdentitySkeleton />}>
            <StoreIdentity storeId={storeId} />
          </Suspense>

          <KTooltip label="Start selling: opens the cash register for this store" align="end">
            <Button asChild size="lg">
              <Link href={`/pos/${storeId}`}>
                <ShoppingCart />
                Open POS
              </Link>
            </Button>
          </KTooltip>
        </div>

        <StoreTabs storeId={storeId} />
      </div>

      <div>{children}</div>
    </div>
  );
}
