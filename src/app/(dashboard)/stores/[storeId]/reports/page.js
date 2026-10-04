import { getStorePageData } from "@/lib/store-page";
import { toDateString } from "@/lib/reports";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata = { title: "Reports | Koetap" };

export default async function StoreReportsPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  // "Today" is decided here, once, so the date presets are the same wherever they're worked out.
  const today = toDateString(new Date());

  return <ReportsView storeId={store.id} currency={store.currency} today={today} />;
}
