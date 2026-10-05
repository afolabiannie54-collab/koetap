import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RowsSkeleton } from "@/components/ui/koetap/page-skeletons";
import { SectionCard } from "@/components/ui/koetap/section-card";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/businesses">
          <ArrowLeft data-icon="inline-start" />
          All businesses
        </Link>
      </Button>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>

      <SectionCard title="Stores">
        <RowsSkeleton rows={2} />
      </SectionCard>
      <SectionCard title="Recent sales" description="The last 20 across all stores (times in UTC)">
        <RowsSkeleton rows={4} />
      </SectionCard>
    </div>
  );
}
