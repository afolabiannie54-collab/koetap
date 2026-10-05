import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"
import { LoaderCircle } from "lucide-react"

// Koetap buttons: rounded-xl, DM Sans medium, a smooth hover and a small press (scale 0.98).
//   default     = primary: black, white text (inverts in dark mode)
//   secondary   = white, black border, black text
//   destructive = white, red border, red text
//   ghost       = transparent
// Pass `loading` while a request is running: it shows a spinner and blocks a second press.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-(--btn-shadow) hover:opacity-90 hover:shadow-md",
        secondary:
          "border-foreground bg-card text-foreground shadow-(--raised-shadow) hover:bg-accent aria-expanded:bg-accent",
        outline:
          "border-foreground bg-card text-foreground shadow-(--raised-shadow) hover:bg-accent aria-expanded:bg-accent",
        destructive:
          "border-destructive bg-card text-destructive shadow-(--raised-shadow) hover:bg-error-soft focus-visible:outline-destructive",
        ghost: "text-foreground hover:bg-accent aria-expanded:bg-accent",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      // loading: a spinner before the label, and the button can't be pressed again while it works
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        // Slot needs exactly one child element, so a link-as-button gets no spinner
        children
      ) : (
        <>
          {loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
