"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Underline tabs. One black bar slides from tab to tab: its position is measured from the current
// tab and written straight to the element, so it moves with a CSS transition instead of jumping.
export function StoreTabs({ storeId }) {
  const pathname = usePathname();
  const base = `/stores/${storeId}`;
  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/products`, label: "Products" },
    { href: `${base}/inventory`, label: "Inventory" },
    { href: `${base}/staff`, label: "Staff" },
    { href: `${base}/reports`, label: "Reports" },
    { href: `${base}/settings`, label: "Settings" },
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
    <nav className="overflow-x-auto border-b border-border" aria-label="Store sections">
      <div ref={listRef} className="relative flex w-max min-w-full gap-1">
        {tabs.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-t-lg px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
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
