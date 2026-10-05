"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/koetap/avatar";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";
import { Wordmark } from "@/components/ui/koetap/wordmark";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { TopBarSlot, TopBarSlotProvider } from "@/components/dashboard/topbar";

const TITLES = [
  ["/dashboard", "Dashboard"],
  ["/stores", "Stores"],
  ["/reports", "Reports"],
  ["/settings", "Settings"],
];

function UserMenu({ user, collapsed = false }) {
  return (
    <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-4")}>
      <div className={cn("flex items-center gap-3", collapsed && "flex-col gap-2")}>
        <Avatar name={user.name} email={user.email} />
        <div className={cn("min-w-0 flex-1", collapsed && "hidden")}>
          <p className="truncate text-sm font-semibold">{user.name || "Account"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <ThemeToggle tipSide={collapsed ? "right" : "top"} />
        <SignOutButton tipSide={collapsed ? "right" : "top"} />
      </div>
    </div>
  );
}

// The Koetap shell: a 240px white sidebar, a 56px top bar with the page title on the left and a slot for
// the page's buttons on the right, and the page itself in a comfortably padded column.
// Below 1024px the sidebar becomes a drawer behind the menu button.
export function DashboardShell({ user, singleStoreId = null, children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed("owner", true);
  const title =
    singleStoreId && pathname.startsWith("/stores/")
      ? "My Store"
      : (TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? "Koetap");

  return (
    <TopBarSlotProvider>
      <div className="flex min-h-screen bg-canvas">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "sticky top-0 z-40 hidden h-screen shrink-0 flex-col bg-sidebar shadow-(--sidebar-shadow) transition-[width] duration-200 lg:flex",
            collapsed ? "w-[68px]" : "w-60"
          )}
        >
          {/* Expanded: the logo and a collapse button. Collapsed: no logo at all, just the expand button. */}
          <div className={cn("flex h-14 items-center", collapsed ? "justify-center" : "justify-between pr-3 pl-5")}>
            {collapsed ? (
              <KTooltip label="Expand sidebar" side="right">
                <Button variant="ghost" size="icon-sm" aria-label="Expand sidebar" onClick={toggleCollapsed}>
                  <PanelLeftOpen />
                </Button>
              </KTooltip>
            ) : (
              <>
                <Wordmark size="sm" />
                <KTooltip label="Collapse sidebar" side="bottom" align="end">
                  <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={toggleCollapsed}>
                    <PanelLeftClose />
                  </Button>
                </KTooltip>
              </>
            )}
          </div>
          {/* Collapsed, the labels pop out to the right of the icons, so this must not clip them */}
          <div className={cn("flex-1 py-4", collapsed ? "overflow-visible px-2" : "overflow-y-auto px-3")}>
            <SidebarNav collapsed={collapsed} singleStoreId={singleStoreId} />
          </div>
          <UserMenu user={user} collapsed={collapsed} />
        </aside>

        {/* Mobile drawer */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Main navigation</SheetDescription>
            <div className="flex h-14 items-center px-5">
              <Wordmark size="sm" />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarNav onNavigate={() => setMenuOpen(false)} singleStoreId={singleStoreId} />
            </div>
            <UserMenu user={user} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-card/90 px-4 shadow-(--topbar-shadow) backdrop-blur sm:px-6 lg:px-8">
            <KTooltip label="Open menu" side="bottom" align="start" className="lg:hidden">
              <Button variant="ghost" size="icon-sm" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                <Menu />
              </Button>
            </KTooltip>
            <p className="text-lg font-semibold tracking-tight">{title}</p>
            <TopBarSlot className="ml-auto flex items-center gap-2" />
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </TopBarSlotProvider>
  );
}
