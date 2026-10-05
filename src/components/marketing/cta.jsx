import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// The big buttons on the marketing pages. The arrow nudges forward on hover.
//   solid:   black on white (white on black in dark mode)
//   outline: a bold black outline
//   invert:  for use on a black band: white button
const STYLES = {
  solid: "bg-foreground text-background hover:bg-foreground/85",
  outline: "border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background",
  invert: "bg-background text-foreground hover:bg-background/90",
};

export function CtaLink({ href, variant = "solid", size = "lg", up = false, className, children }) {
  const Arrow = up ? ArrowUpRight : ArrowRight;
  return (
    <Link
      href={href}
      className={cn(
        "group/cta inline-flex items-center justify-center gap-2.5 rounded-2xl font-bold tracking-tight whitespace-nowrap transition-all duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground active:scale-[0.98]",
        size === "lg" ? "h-14 px-8 text-base sm:text-lg" : "h-10 px-5 text-sm",
        STYLES[variant],
        className
      )}
    >
      {children}
      <Arrow className={cn("transition-transform duration-200 group-hover/cta:translate-x-1", size === "lg" ? "size-5" : "size-4", up && "group-hover/cta:-translate-y-1 group-hover/cta:translate-x-0.5")} strokeWidth={2.5} />
    </Link>
  );
}
