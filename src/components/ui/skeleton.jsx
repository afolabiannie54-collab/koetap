import { cn } from "@/lib/utils"

// A placeholder block with a slow shimmer sweeping across it. Size it with className to match the
// content it stands in for.
function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-xl bg-linear-to-r from-muted via-accent to-muted bg-size-[200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
