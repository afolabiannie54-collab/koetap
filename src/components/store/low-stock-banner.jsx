"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, TriangleAlert, X } from "lucide-react";
import { KTooltip } from "@/components/ui/koetap/tooltip";

// An amber heads-up that some products are running low, with a link to see them. It can be dismissed, and stays
// dismissed for the rest of this browser session (a new session shows it again while products are still low).
const listeners = new Set();
const subscribe = (onChange) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};

export function LowStockBanner({ storeId, count, href }) {
  const key = `koetap-lowstock-dismissed-${storeId}`;
  const dismissed = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false
  );

  if (count === 0 || dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: it comes back next time, which is fine.
    }
    listeners.forEach((l) => l());
  }

  return (
    <div role="status" className="animate-contentIn flex items-center gap-3 rounded-2xl border-2 border-warning bg-warning-soft px-4 py-3 text-warning-ink">
      <TriangleAlert className="size-5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm font-semibold">
        {count} {count === 1 ? "product is" : "products are"} running low.{" "}
        <Link href={href} className="inline-flex items-center gap-1 underline underline-offset-4 hover:no-underline">
          View {count === 1 ? "it" : "them"}
          <ArrowRight className="size-3.5" />
        </Link>
      </p>
      <KTooltip label="Hide this for now" align="end">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss low stock alert"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-warning/20"
        >
          <X className="size-4" />
        </button>
      </KTooltip>
    </div>
  );
}
