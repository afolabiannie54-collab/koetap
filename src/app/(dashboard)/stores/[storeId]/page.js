import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import { findOwnedStore } from "@/lib/api-auth";
import { serializeStore } from "@/lib/stores";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ["overview", "products", "staff", "settings"];

export const metadata = { title: "Store | Koetap" };

export default async function StoreDetailPage({ params, searchParams }) {
  const { storeId } = await params;
  const { tab } = await searchParams;
  const { user } = await auth();

  await connectDB();
  const doc = await findOwnedStore(user, storeId);
  if (!doc) notFound();
  const store = serializeStore(doc);

  const storeObjectId = new mongoose.Types.ObjectId(store.id);
  const [products, sales, lowStock] = await Promise.all([
    Product.countDocuments({ storeId: storeObjectId, isActive: true }),
    Sale.countDocuments({ storeId: storeObjectId }),
    // A product's own threshold wins; otherwise fall back to the store's.
    Product.countDocuments({
      storeId: storeObjectId,
      isActive: true,
      $expr: {
        $lte: ["$stock", { $ifNull: ["$lowStockThreshold", store.lowStockThreshold] }],
      },
    }),
  ]);

  const stats = [
    { label: "Total Products", value: products },
    { label: "Total Sales", value: sales },
    { label: "Low Stock Items", value: lowStock },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/stores">
          <ArrowLeft data-icon="inline-start" />
          Back to stores
        </Link>
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
          <Badge variant={store.isActive ? "default" : "secondary"}>
            {store.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{store.address || "No address set"}</p>
      </div>

      <Tabs defaultValue={TABS.includes(tab) ? tab : "overview"}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, value }) => (
              <Card key={label}>
                <CardHeader>
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className="text-3xl">{value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="pt-4">
          <p className="text-sm text-muted-foreground">Products coming in Phase 4.</p>
        </TabsContent>

        <TabsContent value="staff" className="pt-4">
          <p className="text-sm text-muted-foreground">Staff management coming in Phase 4.</p>
        </TabsContent>

        <TabsContent value="settings" className="pt-4">
          <StoreSettingsForm store={store} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
