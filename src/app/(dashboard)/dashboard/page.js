import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import { businessFilter } from "@/lib/api-auth";
import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard | Koetap" };

export default async function DashboardPage() {
  const { user } = await auth();
  const filter = businessFilter(user);

  await connectDB();
  const [stores, products, sales] = await Promise.all([
    Store.countDocuments({ ...filter, isActive: true }),
    Product.countDocuments({ ...filter, isActive: true }),
    Sale.countDocuments(filter),
  ]);

  const stats = [
    { label: "Total Stores", value: stores },
    { label: "Total Products", value: products },
    { label: "Total Sales", value: sales },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s a snapshot of your business.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {stores === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Create your first store</CardTitle>
            <CardDescription>
              Add a store to start managing products, staff and sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddStoreDialog label="Create your first store" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
