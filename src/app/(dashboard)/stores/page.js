import Link from "next/link";
import { MapPin, Store as StoreIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { serializeStore } from "@/lib/stores";
import { AddStoreDialog } from "@/components/dashboard/add-store-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Stores | Koetap" };

export default async function StoresPage() {
  const { user } = await auth();

  await connectDB();
  const docs = await Store.find(businessFilter(user)).sort({ createdAt: -1 });
  const stores = docs.map(serializeStore);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your business locations.</p>
        </div>
        <AddStoreDialog />
      </div>

      {stores.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <StoreIcon className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-medium">No stores yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first store to start adding products and making sales.
          </p>
          <AddStoreDialog label="Add your first store" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{store.name}</CardTitle>
                  <Badge variant={store.isActive ? "default" : "secondary"}>
                    {store.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {store.address || "No address"}
                </p>
                <p>Currency: {store.currency}</p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button asChild size="sm">
                  <Link href={`/stores/${store.id}`}>Open Store</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/stores/${store.id}?tab=settings`}>Edit</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
