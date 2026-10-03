"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function StoreTabs({ storeId }) {
  const pathname = usePathname();
  const base = `/stores/${storeId}`;
  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/products`, label: "Products" },
    { href: `${base}/reports`, label: "Reports" },
    { href: `${base}/inventory`, label: "Inventory Log" },
    { href: `${base}/staff`, label: "Staff" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Store sections">
      {tabs.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
