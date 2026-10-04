import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBusinessDetail } from "@/lib/admin-data";
import { formatMoney } from "@/lib/stores";
import { PAYMENT_LABELS } from "@/lib/pos";
import { BusinessActions } from "@/components/admin/business-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Business | Koetap Admin" };

const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" });
const formatTime = (d) =>
  new Date(d).toLocaleString("en-NG", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" });

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium [overflow-wrap:anywhere]">{children || "-"}</dd>
    </div>
  );
}

export default async function AdminBusinessDetailPage({ params }) {
  const { businessId } = await params;
  const detail = await getBusinessDetail(businessId);
  if (!detail) notFound();
  const { business, owner, stores, recentSales, totals } = detail;

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/businesses">
          <ArrowLeft data-icon="inline-start" />
          All businesses
        </Link>
      </Button>

      <Card className={business.isActive ? undefined : "border-red-300"}>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl">{business.name}</CardTitle>
            <Badge variant={business.isActive ? "outline" : "destructive"}>
              {business.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={business.plan === "paid" ? "default" : "secondary"}>
              {business.plan === "paid" ? "Paid plan" : "Free plan"}
            </Badge>
          </div>
          {!business.isActive && (
            <CardDescription className="text-red-700">
              Suspended: its owner and cashiers are locked out.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Owner">{owner?.name}</Field>
            <Field label="Owner email">{owner?.email}</Field>
            <Field label="Business phone">{business.phone}</Field>
            <Field label="Business email">{business.email}</Field>
            <Field label="Joined">{formatDate(business.createdAt)}</Field>
            <Field label="Lifetime sales">
              {totals.totalSales} sales · {formatMoney(totals.totalRevenue)}
            </Field>
          </dl>
          <BusinessActions
            businessId={business._id}
            name={business.name}
            isActive={business.isActive}
            plan={business.plan}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell text-right">Products</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell text-right">Staff</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell text-right">Total Sales</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    This business has no stores yet.
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium whitespace-normal [overflow-wrap:anywhere]">
                      {s.name}
                      <p className="mt-0.5 text-xs font-normal text-muted-foreground min-[1300px]:hidden">
                        {s.products} products · {s.staff} staff · {s.totalSales} sales
                      </p>
                    </TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell text-right">{s.products}</TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell text-right">{s.staff}</TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell text-right">{s.totalSales}</TableCell>
                    <TableCell className="text-right">{formatMoney(s.totalRevenue, s.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "outline" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">Products and staff count active ones only.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
          <CardDescription>The last 20 across all stores (times in UTC)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell">Cashier</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell">Payment</TableHead>
                <TableHead className="hidden min-[1300px]:table-cell">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No sales yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentSales.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium whitespace-normal [overflow-wrap:anywhere]">
                      {s.storeName}
                      <p className="mt-0.5 text-xs font-normal text-muted-foreground min-[1300px]:hidden">
                        {s.cashierName} · {PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod} · {formatTime(s.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell whitespace-normal [overflow-wrap:anywhere]">{s.cashierName}</TableCell>
                    <TableCell className="text-right">{formatMoney(s.total, s.currency)}</TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell">
                      <Badge variant="secondary">{PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="hidden min-[1300px]:table-cell whitespace-nowrap">{formatTime(s.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
