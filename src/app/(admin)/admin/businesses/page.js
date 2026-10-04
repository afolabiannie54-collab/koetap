import { BusinessesTable } from "@/components/admin/businesses-table";

export const metadata = { title: "Businesses | Koetap Admin" };

export default function AdminBusinessesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every business on the platform. Revenue is shown as recorded.</p>
      </div>
      <BusinessesTable />
    </div>
  );
}
