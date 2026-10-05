"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { cn } from "@/lib/utils";

// The store's own sidebar. Inside a store you are in that store's space, not Koetap's: the sidebar has the store's
// logo slot and name at the top, an Open POS button, the six sections of the store, and "Back to Koetap" pinned at
// the bottom, always in the same place.
//
// logo / name / status are server-rendered pieces (the store's logo or initial, its name, its Active badge) passed in,
// so the navigation shows immediately while those fill in from the database.
//
// The accent colour (--store-accent, set by the layout) appears in just three places: the logo tile, the Open POS
// button, and the bar beside the current section. Everything else is black and white.
function buildTabs(storeId) {
  const base = `/stores/${storeId}`;
  return [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true, tip: "How this store is doing: today's numbers, recent sales and what needs attention" },
    { href: `${base}/products`, label: "Products", icon: Package, tip: "What you sell, with prices, stock and categories" },
    { href: `${base}/inventory`, label: "Inventory", icon: ClipboardList, tip: "A log of every stock change: sales, restocks and corrections, and who made them" },
    { href: `${base}/staff`, label: "Staff", icon: Users, tip: "The cashiers who can sign in to this store's POS" },
    { href: `${base}/reports`, label: "Reports", icon: ChartColumn, tip: "Sales, revenue and best sellers over any period" },
    { href: `${base}/settings`, label: "Settings", icon: Settings, tip: "Store name, currency, logo, colours and what receipts say" },
  ];
}

const ACCENT_BG = "var(--store-accent, var(--primary))";
const ACCENT_FG = "var(--store-accent-fg, var(--primary-foreground))";

function OpenPos({ storeId, collapsed, onNavigate }) {
  return (
    <KTooltip label="Start selling: opens the cash register for this store" side="right" className={cn(!collapsed && "w-full")}>
      <Link
        href={`/pos/${storeId}`}
        onClick={onNavigate}
        style={{ background: ACCENT_BG, color: ACCENT_FG }}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-(--btn-shadow) transition-all duration-150 hover:opacity-90 active:scale-[0.98]",
          collapsed ? "size-11" : "w-full"
        )}
      >
        <ShoppingCart className="size-5" />
        <span className={cn(collapsed && "sr-only")}>Open POS</span>
      </Link>
    </KTooltip>
  );
}

function SidebarBody({ storeId, logo, name, status, collapsed = false, onToggle, onNavigate }) {
  const pathname = usePathname();
  const tabs = buildTabs(storeId);
  const isActive = ({ href, exact }) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      {/* Top: the store's logo slot and name. Collapsed: no identity, just the expand button (as on the Koetap dashboard) */}
      {collapsed ? (
        <div className="flex h-16 shrink-0 items-center justify-center">
          <KTooltip label="Expand sidebar" side="right">
            <Button variant="ghost" size="icon-sm" aria-label="Expand sidebar" onClick={onToggle}>
              <PanelLeftOpen />
            </Button>
          </KTooltip>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-3 px-4 py-4">
          {logo}
          <div className="min-w-0 flex-1">
            {name}
            <div className="mt-0.5">{status}</div>
          </div>
          {onToggle && (
            <KTooltip label="Collapse sidebar" side="bottom" align="end">
              <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={onToggle}>
                <PanelLeftClose />
              </Button>
            </KTooltip>
          )}
        </div>
      )}

      <div className={cn("shrink-0 pb-4", collapsed ? "flex justify-center" : "px-4")}>
        <OpenPos storeId={storeId} collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      <div className={cn("flex-1 overflow-y-auto border-t border-border py-4", collapsed ? "overflow-visible px-2" : "px-3")}>
        <nav aria-label="Store sections" className="space-y-1">
          {!collapsed && <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-muted-foreground">THIS STORE</p>}
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;
            const link = (
              <Link
                href={tab.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-150",
                  collapsed && "w-full justify-center px-0",
                  active ? "bg-accent font-bold text-foreground" : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    style={{ background: "var(--store-accent, var(--foreground))" }}
                    className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full"
                  />
                )}
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span className={cn(collapsed && "sr-only")}>{tab.label}</span>
              </Link>
            );
            return (
              <KTooltip key={tab.href} label={collapsed ? `${tab.label}: ${tab.tip}` : tab.tip} side="right" className="flex w-full">
                {link}
              </KTooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom: the way back out, always here */}
      <div className={cn("shrink-0 border-t border-border", collapsed ? "flex flex-col items-center gap-2 px-2 py-3" : "space-y-2 p-4")}>
        <KTooltip label="Leave this store and go back to your Koetap dashboard" side="right" className={cn(!collapsed && "w-full")}>
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl border border-foreground bg-card text-sm font-semibold shadow-(--raised-shadow) transition-all duration-150 hover:bg-accent active:scale-[0.98]",
              collapsed ? "size-11" : "w-full"
            )}
          >
            <ArrowLeft className="size-4" />
            <span className={cn(collapsed && "sr-only")}>Back to Koetap</span>
          </Link>
        </KTooltip>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
          {!collapsed && <span className="text-xs text-muted-foreground">Theme</span>}
          <ThemeToggle tipSide="right" />
        </div>
      </div>
    </>
  );
}

export function StoreSidebar({ storeId, logo, name, status, children }) {
  const [collapsed, toggle] = useSidebarCollapsed("store", false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 z-40 hidden h-screen shrink-0 flex-col bg-sidebar shadow-(--sidebar-shadow) transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarBody storeId={storeId} logo={logo} name={name} status={status} collapsed={collapsed} onToggle={toggle} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Small screens: a slim top bar with the store's name and the menu button */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 shadow-(--topbar-shadow) lg:hidden">
          <KTooltip label="Open the store menu" side="bottom" align="start">
            <Button variant="ghost" size="icon-sm" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu />
            </Button>
          </KTooltip>
          <div className="min-w-0 flex-1">{name}</div>
          <Link
            href={`/pos/${storeId}`}
            style={{ background: ACCENT_BG, color: ACCENT_FG }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold shadow-(--btn-shadow)"
          >
            <ShoppingCart className="size-4" />
            POS
          </Link>
        </header>

        {children}
      </div>

      {/* The same sidebar as a drawer on small screens */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent>
          <SheetTitle>Store menu</SheetTitle>
          <SheetDescription>Sections of this store</SheetDescription>
          <SidebarBody storeId={storeId} logo={logo} name={name} status={status} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
