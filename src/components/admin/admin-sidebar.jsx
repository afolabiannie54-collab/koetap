"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSignOut } from "@/components/admin/admin-sign-out";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/koetap/avatar";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";
import { Wordmark } from "@/components/ui/koetap/wordmark";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { cn } from "@/lib/utils";

const GHOST = "text-white/70 hover:bg-white/10 hover:text-white";

// The admin's near-black desktop sidebar, collapsible to icons. Phones use the top bar in the layout.
export function AdminSidebar({ name, email }) {
  const [collapsed, toggle] = useSidebarCollapsed("admin");

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col bg-[#0A0A0A] text-white transition-[width] duration-200 md:flex",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className={cn("py-5", collapsed ? "flex flex-col items-center gap-3 px-2" : "px-5")}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Wordmark text={!collapsed} className="text-white [--wordmark-dot:#0A0A0A]" />
            {!collapsed && (
              <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#0A0A0A] uppercase">Admin</span>
            )}
          </span>
          {!collapsed && (
            <Button variant="ghost" size="icon-sm" className={GHOST} aria-label="Collapse sidebar" title="Collapse sidebar" onClick={toggle}>
              <PanelLeftClose />
            </Button>
          )}
        </div>
        {collapsed ? (
          <Button variant="ghost" size="icon-sm" className={GHOST} aria-label="Expand sidebar" title="Expand sidebar" onClick={toggle}>
            <PanelLeftOpen />
          </Button>
        ) : (
          <p className="mt-1.5 text-xs text-white/50">Internal platform tools</p>
        )}
      </div>
      <div className={cn("flex-1", collapsed ? "px-2" : "px-3")}>
        <AdminNav collapsed={collapsed} />
      </div>
      <div className={cn("border-t border-white/10", collapsed ? "flex flex-col items-center gap-2 px-2 py-3" : "flex items-center gap-3 px-4 py-4")}>
        <Avatar name={name} email={email} className="bg-white text-[#0A0A0A]" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name || "Super admin"}</p>
            <p className="truncate text-xs text-white/50">{email}</p>
          </div>
        )}
        <ThemeToggle className={GHOST} />
        <AdminSignOut />
      </div>
    </aside>
  );
}
