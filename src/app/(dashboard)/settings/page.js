import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Business from "@/models/Business";
import Product from "@/models/Product";
import Sale from "@/models/Sale";
import Store from "@/models/Store";
import { businessFilter } from "@/lib/api-auth";
import { DeleteAccountSection } from "@/components/dashboard/delete-account-section";
import { PageHeader } from "@/components/ui/koetap/page-header";
import { SectionCard } from "@/components/ui/koetap/section-card";

export const metadata = { title: "Settings | Koetap" };

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold [overflow-wrap:anywhere]">{children || "-"}</dd>
    </div>
  );
}

// The owner's account page: who they are, and the way to close the account. Store settings live inside each store.
export default async function SettingsPage() {
  const { user } = await auth();
  const isOwner = user.role === "owner";

  let business = null;
  let impact = { stores: 0, products: 0, sales: 0 };
  if (isOwner) {
    await connectDB();
    const filter = businessFilter(user);
    const [biz, stores, products, sales] = await Promise.all([
      user.businessId ? Business.findById(user.businessId).select("name").lean() : null,
      Store.countDocuments(filter),
      Product.countDocuments(filter),
      Sale.countDocuments(filter),
    ]);
    business = biz;
    impact = { stores, products, sales };
  }

  return (
    <div className="animate-contentIn space-y-8">
      <PageHeader title="Settings" description="Your account. Store settings live inside each store." />

      <SectionCard title="Your account" description="How you sign in to Koetap">
        <dl className="divide-y divide-border">
          <Row label="Name">{user.name}</Row>
          <Row label="Email">{user.email}</Row>
          {business && <Row label="Business">{business.name}</Row>}
        </dl>
      </SectionCard>

      {isOwner && <DeleteAccountSection expected={business?.name ?? user.email} impact={impact} />}
    </div>
  );
}
