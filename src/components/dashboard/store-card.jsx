import Link from "next/link";
import { MapPin, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KBadge } from "@/components/ui/koetap/KBadge";
import { KCard } from "@/components/ui/koetap/KCard";
import { Badge } from "@/components/ui/badge";

// One store on the dashboard and the stores list. The whole card lifts on hover; "Open Store" is the way in.
export function StoreCard({ store, counts }) {
  return (
    <KCard hover className="gap-4">
      <div className="flex items-start justify-between gap-3 px-(--card-spacing)">
        <h3 className="min-w-0 text-lg font-semibold tracking-tight [overflow-wrap:anywhere]">{store.name}</h3>
        <KBadge variant={store.isActive ? "active" : "inactive"}>{store.isActive ? "Active" : "Inactive"}</KBadge>
      </div>

      <p className="flex items-start gap-1.5 px-(--card-spacing) text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        <span className="[overflow-wrap:anywhere]">{store.address || "No address yet"}</span>
      </p>

      <div className="flex flex-wrap gap-2 px-(--card-spacing)">
        <Badge variant="outline" className="gap-1.5">
          <Package />
          {counts.products} {counts.products === 1 ? "product" : "products"}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <Users />
          {counts.cashiers} {counts.cashiers === 1 ? "cashier" : "cashiers"}
        </Badge>
      </div>

      <div className="mt-auto px-(--card-spacing)">
        <Button asChild className="w-full">
          <Link href={`/stores/${store.id}`}>Open Store</Link>
        </Button>
      </div>
    </KCard>
  );
}
