import { Skeleton } from "@/components/ui/skeleton";

// Store settings as they load: the real section titles, descriptions and field labels, with grey bars where the
// current values will be.
function Section({ title, description, fields }) {
  return (
    <section className="grid gap-6 border-t border-border py-8 first:border-t-0 first:pt-0 md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="max-w-xl space-y-4">
        {fields.map(([label, tall]) => (
          <div key={label} className="space-y-1.5">
            <p className="text-sm font-medium">{label}</p>
            <Skeleton className={tall ? "h-20 w-full" : "h-10 w-full"} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Loading() {
  return (
    <div>
      <Section
        title="Store details"
        description="The basics shown across your store and on receipts."
        fields={[["Store name"], ["Address"], ["Currency"], ["Low stock alert at"]]}
      />
      <Section
        title="Branding"
        description="How your POS looks to your cashiers, and what your receipts say."
        fields={[["Accent colour"], ["Receipt footer", true]]}
      />
    </div>
  );
}
