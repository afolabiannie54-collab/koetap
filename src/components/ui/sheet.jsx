"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

// A panel that slides in from the left. Used for the mobile navigation drawer.
function Sheet(props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetTitle({ className, ...props }) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("sr-only", className)} {...props} />
}

function SheetDescription({ className, ...props }) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn("sr-only", className)} {...props} />
}

function SheetContent({ className, children, ...props }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[4px] data-open:animate-fadeIn data-closed:animate-out data-closed:fade-out-0 data-closed:duration-150"
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-lg outline-none data-open:animate-in data-open:slide-in-from-left data-open:duration-200 data-closed:animate-out data-closed:slide-out-to-left data-closed:duration-150",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <XIcon className="size-4" />
          <span className="sr-only">Close menu</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger }
