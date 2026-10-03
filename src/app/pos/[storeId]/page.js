import { getPosAccess, loadPosProducts } from "@/lib/pos-data";
import { PosScreen } from "@/components/pos/pos-screen";

export const metadata = { title: "POS | Koetap" };

export default async function PosPage({ params }) {
  const { storeId } = await params;
  const { user, store } = await getPosAccess(storeId);

  if (!store.isActive) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">{store.name} is inactive</h1>
          <p className="mt-2 text-sm text-gray-500">Sales are turned off for this store. Contact your store owner.</p>
        </div>
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
