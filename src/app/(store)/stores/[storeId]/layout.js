import { Suspense } from "react";
import { StoreSidebar } from "@/components/store/store-sidebar";
import {
  StoreAccentStyle,
  StoreBreadcrumb,
  StoreLogoSlot,
  StoreLogoSlotSkeleton,
  StoreNameSkeleton,
  StoreNameText,
  StoreNavStatus,
} from "@/components/store/store-env-parts";

export const metadata = { title: "Store | Koetap" };

// A store's own space, with its own sidebar instead of the Koetap one. Only the parts that need the store loaded
// (logo slot, name, status, accent colour, breadcrumb) wait inside <Suspense>; the sidebar's links and buttons come
// from the URL and are there straight away.
export default async function StoreEnvironmentLayout({ children, params }) {
  const { storeId } = await params;

  return (
    <div className="store-env bg-background">
      <Suspense fallback={null}>
        <StoreAccentStyle storeId={storeId} />
      </Suspense>

      <StoreSidebar
        storeId={storeId}
        logo={
          <Suspense fallback={<StoreLogoSlotSkeleton />}>
            <StoreLogoSlot storeId={storeId} />
          </Suspense>
        }
        name={
          <Suspense fallback={<StoreNameSkeleton />}>
            <StoreNameText storeId={storeId} />
          </Suspense>
        }
        status={
          <Suspense fallback={null}>
            <StoreNavStatus storeId={storeId} />
          </Suspense>
        }
      >
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<div className="h-4" />}>
            <StoreBreadcrumb storeId={storeId} />
          </Suspense>
          <div className="mt-5">{children}</div>
        </main>
      </StoreSidebar>
    </div>
  );
}
