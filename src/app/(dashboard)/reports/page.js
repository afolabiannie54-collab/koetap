import Link from "next/link";
import { redirect } from "next/navigation";
import { ChartColumn } from "lucide-react";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { serializeStore } from "@/lib/stores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Reports | Koetap" };

// Reports are per store. This page just gets you to the right one.
export default async function ReportsIndexPage() {
  const { user } = await auth();

  await connectDB();
  const docs = await Store.find(businessFilter(user)).sort({ createdAt: -1 });
  const stores = docs.map(serializeStore);
  const active = stores.filter((s) => s.isActive);

  // One store: nothing to choose, go straight to its reports.
  if (stores.length === 1) redirect(`/stores/${stores[0].id}/reports`);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a store to see its sales reports.</p>
      </div>

      {stores.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <ChartColumn className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-medium">No stores yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Reports are built from a store&apos;s sales. Create a store first.
          </p>
          <Button asChild>
            <Link href="/stores">Go to stores</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* Active stores first; inactive ones keep their history, so they stay reachable */}
          {[...active, ...stores.filter((s) => !s.isActive)].map((store) => (
            <Card key={store.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{store.name}</CardTitle>
                  <Badge variant={store.isActive ? "default" : "secondary"}>
                    {store.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{store.address || "No address"}</CardContent>
              <CardFooter>
                <Button asChild size="sm">
                  <Link href={`/stores/${store.id}/reports`}>
                    <ChartColumn data-icon="inline-start" />
                    View reports
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
