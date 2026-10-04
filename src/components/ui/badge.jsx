import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Pill badges with tinted backgrounds, so a status reads at a glance and still passes contrast in dark mode.
//   default = active / success (green)      secondary = inactive (grey)
//   destructive = suspended / error (red)   warning (amber)   info (blue)   outline = neutral, bordered
const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-success-soft text-success-ink",
        secondary: "bg-accent text-muted-foreground",
        destructive: "bg-error-soft text-error-ink",
        warning: "bg-warning-soft text-warning-ink",
        info: "bg-info-soft text-info-ink",
        outline: "border-border bg-transparent text-foreground",
        ghost: "text-muted-foreground hover:bg-accent",
        link: "text-foreground underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
