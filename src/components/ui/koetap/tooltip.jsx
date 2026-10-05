"use client";

import { Tooltip } from "radix-ui";
import { cn } from "@/lib/utils";

// A small label that appears on hover or keyboard focus, for any control.
//
// The label is drawn in a portal at the very top of the page, above everything else (dialogs, sticky bars,
// scrolling tables), so nothing can cover or clip it. It also moves itself to stay on screen: if there is
// no room above a control it opens below, and so on.
//
// The control inside should still carry an aria-label: this is a visual aid, not the accessible name.
//
// side:  where the label prefers to go: "top" (default), "bottom", "right" or "left".
// align: "center" (default), "start" or "end" along that side.
// className lays out the wrapper around the control (the wrapper is an inline-flex span).
export function KTooltip({ label, children, className, side = "top", align = "center", delay = 250 }) {
  if (!label) return children;

  return (
    <Tooltip.Provider delayDuration={delay} skipDelayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className={cn("inline-flex", className)}>{children}</span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            align={align}
            sideOffset={8}
            collisionPadding={10}
            className="pointer-events-none z-[200] max-w-64 rounded-lg bg-foreground px-2.5 py-1.5 text-xs leading-snug font-medium text-background shadow-lg data-[state=delayed-open]:animate-fadeIn data-[state=instant-open]:animate-fadeIn"
          >
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
