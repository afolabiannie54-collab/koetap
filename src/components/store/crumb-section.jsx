"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const SECTIONS = { products: "Products", inventory: "Inventory", staff: "Staff", reports: "Reports", settings: "Settings" };

// The last part of the breadcrumb: which section of the store you are in. Nothing on the overview itself.
export function CrumbSection({ storeId }) {
  const pathname = usePathname();
  const rest = pathname.startsWith(`/stores/${storeId}/`) ? pathname.slice(`/stores/${storeId}/`.length).split("/")[0] : "";
  const label = SECTIONS[rest];
  if (!label) return null;

  return (
    <>
      <ChevronRight className="size-3.5" />
      <span aria-current="page" className="font-semibold text-foreground">
        {label}
      </span>
    </>
  );
}
