import { Settings } from "lucide-react";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { PageHeader } from "@/components/ui/koetap/page-header";

export const metadata = { title: "Settings | Koetap Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <EmptyState icon={Settings} title="Nothing to configure yet" description="Platform settings will live here." />
    </div>
  );
}
