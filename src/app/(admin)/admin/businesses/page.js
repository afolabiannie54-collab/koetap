import { PageHeader } from "@/components/ui/koetap/page-header";
import { BusinessesTable } from "@/components/admin/businesses-table";

export const metadata = { title: "Businesses | Koetap Admin" };

export default function AdminBusinessesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Businesses" description="Every business on the platform. Revenue is shown as recorded." />
      <BusinessesTable />
    </div>
  );
}
