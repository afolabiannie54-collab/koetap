import { getStorePageData } from "@/lib/store-page";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";

export const metadata = { title: "Store Settings | Koetap" };

export default async function StoreSettingsPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  return <StoreSettingsForm store={store} />;
}
