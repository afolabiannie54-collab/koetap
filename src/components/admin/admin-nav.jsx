"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, Gauge, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true },
  { href: "/admin/businesses", label: "Businesses", icon: Building },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ orientation = "vertical" }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex gap-1", orientation === "vertical" ? "flex-col" : "flex-row overflow-x-auto")}>
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-amber-400 text-stone-950 shadow-sm"
                : "text-stone-600 hover:bg-amber-100 hover:text-stone-950"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
