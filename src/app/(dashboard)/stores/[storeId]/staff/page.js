import connectDB from "@/lib/db";
import User from "@/models/User";
import { getStorePageData } from "@/lib/store-page";
import { serializeStaff } from "@/lib/staff";
import { StaffTable } from "@/components/dashboard/staff-table";

export const metadata = { title: "Staff | Koetap" };

const formatDate = (d) => new Date(d).toLocaleDateString("en-NG", { dateStyle: "medium" });

export default async function StaffPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  await connectDB();
  const docs = await User.find({
    role: "cashier",
    storeId: store.id,
    businessId: store.businessId,
  })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  // Dates are formatted here so server and client render the same text.
  const staff = docs.map((u) => {
    const s = serializeStaff(u);
    return { ...s, dateAdded: formatDate(s.createdAt), createdAt: undefined };
  });

  return <StaffTable storeId={store.id} staff={staff} />;
}
