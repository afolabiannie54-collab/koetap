"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, ChartColumn, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/reports", label: "Reports", icon: ChartColumn },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ orientation = "vertical" }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row overflow-x-auto"
      )}
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
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
