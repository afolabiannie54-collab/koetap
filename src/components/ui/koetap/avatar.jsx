import { cn } from "@/lib/utils";

const SIZES = { sm: "size-8 text-xs", md: "size-9 text-sm", lg: "size-11 text-base" };

// A circle with someone's initials.
export function Avatar({ name, email, size = "md", className }) {
  const source = (name || email || "?").trim();
  const initials = source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        SIZES[size] ?? SIZES.md,
        className
      )}
    >
      {initials || "?"}
    </span>
  );
}
