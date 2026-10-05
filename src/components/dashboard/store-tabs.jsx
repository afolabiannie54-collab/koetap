"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, ClipboardList, LayoutDashboard, Package, Settings, Users } from "lucide-react";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { cn } from "@/lib/utils";

// Underline tabs along the bottom of the store's header panel. One black bar slides from tab to tab: its
// position is measured from the current tab and written straight to the element, so it moves with a CSS
// transition instead of jumping. Hovering a tab explains what is inside it.
export function StoreTabs({ storeId }) {
  const pathname = usePathname();
  const base = `/stores/${storeId}`;
  const tabs = [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true, tip: "How this store is doing: today's numbers, recent sales and what needs attention" },
    { href: `${base}/products`, label: "Products", icon: Package, tip: "What you sell, with prices, stock and categories" },
    { href: `${base}/inventory`, label: "Inventory", icon: ClipboardList, tip: "A log of every stock change: sales, restocks and corrections, and who made them" },
    { href: `${base}/staff`, label: "Staff", icon: Users, tip: "The cashiers who can sign in to this store's POS" },
    { href: `${base}/reports`, label: "Reports", icon: ChartColumn, tip: "Sales, revenue and best sellers over any period" },
    { href: `${base}/settings`, label: "Settings", icon: Settings, tip: "Store name, currency, colours and what receipts say" },
  ];

  const listRef = useRef(null);
  const barRef = useRef(null);
  const placedOnce = useRef(false);

  useEffect(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;

    const place = () => {
      const current = list.querySelector('[aria-current="page"]');
      if (!current) {
        bar.style.opacity = "0";
        return;
      }
      // The very first placement should appear in position, not slide in from the left.
      if (!placedOnce.current) bar.style.transition = "none";
      bar.style.opacity = "1";
      bar.style.width = `${current.offsetWidth}px`;
      bar.style.transform = `translateX(${current.offsetLeft}px)`;
      if (!placedOnce.current) {
        bar.getBoundingClientRect(); // apply the move before transitions switch back on
        bar.style.transition = "";
        placedOnce.current = true;
      }
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <nav className="overflow-x-auto border-t border-border bg-card px-3 sm:px-4" aria-label="Store sections">
      <div ref={listRef} className="relative flex w-max min-w-full gap-1">
        {tabs.map(({ href, label, icon: Icon, exact, tip }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <KTooltip key={href} label={tip} side="bottom">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </KTooltip>
          );
        })}
        <span
          ref={barRef}
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-0.5 rounded-full bg-foreground opacity-0 transition-[transform,width] duration-200 ease-out"
        />
      </div>
    </nav>
  );
}
