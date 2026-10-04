import { Settings } from "lucide-react";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { PageHeader } from "@/components/ui/koetap/page-header";

export const metadata = { title: "Settings | Koetap" };

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Your account and business profile." />
      <EmptyState
        icon={Settings}
        title="Account settings are coming"
        description="Soon you'll manage your business profile, contact details and password here. Store settings live inside each store."
      />
    </div>
  );
}
