import Link from "next/link";
import { getPlatformStats, getRecentActivity } from "@/lib/admin-data";
import { formatMoney } from "@/lib/stores";
import { SignupsChart } from "@/components/admin/signups-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Overview | Koetap Admin" };

const formatTime = (d) =>
  new Date(d).toLocaleString("en-NG", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" });

export default async function AdminOverviewPage() {
  const [stats, activity] = await Promise.all([getPlatformStats(), getRecentActivity(10)]);

  const cards = [
    { label: "Total Businesses", value: stats.totalBusinesses },
    { label: "Total Stores", value: stats.totalStores, note: "Active stores only" },
    { label: "Total Sales", value: stats.totalSales },
    { label: "Total Revenue", value: formatMoney(stats.totalRevenue) },
    { label: "New Businesses This Month", value: stats.newBusinessesThisMonth },
    { label: "Active Cashiers", value: stats.activeCashiers },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything across every business on Koetap.</p>
      </div>

      <section aria-label="Platform stats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, note }) => (
          <Card key={label} className="border-amber-200">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
              {note && <p className="text-xs text-muted-foreground">{note}</p>}
            </CardHeader>
          </Card>
        ))}
      </section>
      <p className="-mt-4 text-xs text-muted-foreground">
        Revenue adds up sale totals as recorded, whatever currency each store uses. Dates and times are UTC.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>New business signups</CardTitle>
          <CardDescription>Per day, last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupsChart points={stats.signupsLast30Days} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The 10 most recent sales across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ul className="divide-y">
              {activity.map((s) => (
                <li key={s._id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.storeName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.businessId ? (
                        <Link href={`/admin/businesses/${s.businessId}`} className="hover:underline">
                          {s.businessName}
                        </Link>
                      ) : (
                        s.businessName
                      )}{" "}
                      · {formatTime(s.createdAt)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{formatMoney(s.total, s.currency)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
