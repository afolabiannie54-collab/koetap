"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, LayoutDashboard, Settings, Store } from "lucide-react";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/reports", label: "Reports", icon: ChartColumn },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Icon + label rows. Hover fills with light grey; the current page is a black pill with white text.
// singleStoreId: when the owner has exactly one store, "Stores" and "Reports" go straight to it (and highlight
// there), rather than to a list or picker with only one thing in it.
export function SidebarNav({ onNavigate, collapsed = false, singleStoreId = null }) {
  const pathname = usePathname();

  const links = NAV_LINKS.map((link) => {
    if (!singleStoreId) return { ...link, isActive: (p) => p === link.href || p.startsWith(`${link.href}/`) };
    const base = `/stores/${singleStoreId}`;
    if (link.href === "/stores") {
      return { ...link, label: "My Store", href: base, isActive: (p) => (p === base || p.startsWith(`${base}/`)) && !p.startsWith(`${base}/reports`) };
    }
    if (link.href === "/reports") {
      return { ...link, href: `${base}/reports`, isActive: (p) => p.startsWith(`${base}/reports`) };
    }
    return { ...link, isActive: (p) => p === link.href || p.startsWith(`${link.href}/`) };
  });

  return (
    <nav aria-label="Main" className="space-y-1">
      {!collapsed && <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-grey-400">MENU</p>}
      {links.map(({ href, label, icon: Icon, isActive }) => {
        const active = isActive(pathname);
        const link = (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150",
              // Collapsed: fill the narrow column and centre the icon, so the active highlight is a neat square
              collapsed && "w-full justify-center px-0",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={1.75} />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
          </Link>
        );
        return collapsed ? (
          <KTooltip key={href} label={label} side="right" className="flex w-full">
            {link}
          </KTooltip>
        ) : (
          link
        );
      })}
    </nav>
  );
}
