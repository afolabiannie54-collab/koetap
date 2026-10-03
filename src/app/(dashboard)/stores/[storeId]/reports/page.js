import { getStorePageData } from "@/lib/store-page";
import { toDateString } from "@/lib/reports";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata = { title: "Reports | Koetap" };

const DEFAULT_ACCENT = "#4f46e5";

export default async function StoreReportsPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  // "Today" is decided here, once, so the date presets are the same wherever they're worked out.
  const today = toDateString(new Date());
  const accent = /^#[0-9a-fA-F]{6}$/.test(store.accentColor) ? store.accentColor : DEFAULT_ACCENT;

  return <ReportsView storeId={store.id} currency={store.currency} accent={accent} today={today} />;
}
