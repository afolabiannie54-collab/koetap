import * as React from "react"
import { cn } from "@/lib/utils"

// White (or card-dark) background, light grey border, rounded-xl. Focus turns the border black and
// adds a thin ring; aria-invalid turns it red.
function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-input bg-background px-3.5 py-2 text-base text-foreground transition-colors duration-150 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-muted-foreground/60 focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
