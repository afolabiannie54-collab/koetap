import { StoreIcon } from "lucide-react";
import { getPosAccess, loadPosProducts } from "@/lib/pos-data";
import { PosScreen } from "@/components/pos/pos-screen";
import { EmptyState } from "@/components/ui/koetap/empty-state";

export const metadata = { title: "POS | Koetap" };

export default async function PosPage({ params }) {
  const { storeId } = await params;
  const { user, store } = await getPosAccess(storeId);

  if (!store.isActive) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted px-4">
        <EmptyState
          icon={StoreIcon}
          title={`${store.name} is inactive`}
          description="Sales are turned off for this store. Contact your store owner."
          className="max-w-md border-solid bg-card"
        />
      </main>
    );
  }

  const products = await loadPosProducts(store.id);

  return (
    <PosScreen
      store={store}
      cashierName={user.name || user.email}
      role={user.role}
      initialProducts={products}
    />
  );
}
