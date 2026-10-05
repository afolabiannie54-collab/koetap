import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import User from "@/models/User";
import { getStorePageData } from "@/lib/store-page";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";

export const metadata = { title: "Store Settings | Koetap" };

export default async function StoreSettingsPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  // What deleting the store would remove, so the warning can say so exactly
  await connectDB();
  const [products, cashiers, sales] = await Promise.all([
    Product.countDocuments({ storeId: store.id }),
    User.countDocuments({ role: "cashier", storeId: store.id }),
    Sale.countDocuments({ storeId: store.id }),
  ]);

  return <StoreSettingsForm store={store} impact={{ products, cashiers, sales }} />;
}
