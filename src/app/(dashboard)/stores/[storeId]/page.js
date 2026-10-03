import Link from "next/link";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import { getStorePageData } from "@/lib/store-page";
import { lowStockExpr } from "@/lib/products";
import { formatMoney } from "@/lib/stores";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StoreOverviewPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  await connectDB();
  const id = new mongoose.Types.ObjectId(store.id);
  const [products, sales, revenue, lowStock] = await Promise.all([
    Product.countDocuments({ storeId: id, isActive: true }),
    Sale.countDocuments({ storeId: id }),
    Sale.aggregate([{ $match: { storeId: id } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Product.countDocuments({
      storeId: id,
      isActive: true,
      $expr: lowStockExpr(store.lowStockThreshold),
    }),
  ]);

  const stats = [
    { label: "Active Products", value: products },
    { label: "Total Sales", value: sales },
    { label: "Total Revenue", value: formatMoney(revenue[0]?.total ?? 0, store.currency) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value }) => (
        <Card key={label}>
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-3xl">{value}</CardTitle>
          </CardHeader>
        </Card>
      ))}

      {/* Clickable: opens the products list already filtered to low stock */}
      <Link
        href={`/stores/${store.id}/products?low=1`}
        className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Card className="h-full transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className={lowStock > 0 ? "text-3xl text-amber-600" : "text-3xl"}>
              {lowStock}
            </CardTitle>
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}
