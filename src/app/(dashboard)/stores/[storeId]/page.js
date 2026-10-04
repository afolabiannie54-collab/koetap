import Link from "next/link";
import mongoose from "mongoose";
import { AlertTriangle, Banknote, Package, Receipt, Users } from "lucide-react";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import User from "@/models/User";
import { getStorePageData } from "@/lib/store-page";
import { lowStockExpr } from "@/lib/products";
import { formatMoney } from "@/lib/stores";
import { StatCard } from "@/components/ui/koetap/stat-card";

const LINK_CLASS = "block rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard icon={Package} label="Active Products" value={products} />
      <StatCard icon={Receipt} label="Total Sales" value={sales} />
      <StatCard icon={Banknote} label="Total Revenue" value={formatMoney(revenue[0]?.total ?? 0, store.currency)} />

      {/* Clickable: opens the products list already filtered to low stock */}
      <Link href={`/stores/${store.id}/products?low=1`} className={LINK_CLASS}>
        <StatCard
          hover
          icon={AlertTriangle}
          label="Low Stock Items"
          value={<span className={lowStock > 0 ? "text-warning" : undefined}>{lowStock}</span>}
          note={lowStock > 0 ? "View items running low" : "Everything is well stocked"}
          className="h-full"
        />
      </Link>

      {/* Clickable: opens the Staff tab */}
      <Link href={`/stores/${store.id}/staff`} className={LINK_CLASS}>
        <StatCard hover icon={Users} label="Active Cashiers" value={cashiers} note="Manage staff" className="h-full" />
      </Link>
    </div>
  );
}
