import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import User from "@/models/User";
import { getStorePageData } from "@/lib/store-page";
import { lowStockExpr } from "@/lib/products";
import { formatMoney } from "@/lib/stores";
import { StatGroup } from "@/components/ui/koetap/stat-group";

export default async function StoreOverviewPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  await connectDB();
  const id = new mongoose.Types.ObjectId(store.id);
  const [products, sales, revenue, lowStock, cashiers] = await Promise.all([
    Product.countDocuments({ storeId: id, isActive: true }),
    Sale.countDocuments({ storeId: id }),
    Sale.aggregate([{ $match: { storeId: id } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Product.countDocuments({
      storeId: id,
      isActive: true,
      $expr: lowStockExpr(store.lowStockThreshold),
    }),
    User.countDocuments({ role: "cashier", storeId: id, businessId: store.businessId, isActive: true }),
  ]);

  return (
    <StatGroup
      items={[
        { label: "Active Products", value: products },
        { label: "Total Sales", value: sales },
        { label: "Total Revenue", value: formatMoney(revenue[0]?.total ?? 0, store.currency) },
        {
          label: "Low Stock Items",
          value: <span className={lowStock > 0 ? "text-warning-ink" : undefined}>{lowStock}</span>,
          note: lowStock > 0 ? "View items running low" : "Everything is well stocked",
          href: `/stores/${store.id}/products?low=1`,
        },
        { label: "Active Cashiers", value: cashiers, note: "Manage staff", href: `/stores/${store.id}/staff` },
      ]}
    />
  );
}
