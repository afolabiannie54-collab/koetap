import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base text-foreground transition-colors duration-150 outline-none placeholder:text-muted-foreground hover:border-muted-foreground/60 focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
