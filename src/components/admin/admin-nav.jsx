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

export function AdminNav({ orientation = "vertical", collapsed = false }) {
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
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150",
              collapsed && "justify-center px-0",
              active ? "bg-white text-[#0A0A0A]" : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="size-4" />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
