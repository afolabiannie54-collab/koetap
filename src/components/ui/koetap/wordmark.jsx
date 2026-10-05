import { cn } from "@/lib/utils";

// Koetap, in DM Sans bold, with a small geometric mark: a rounded square with a dot, like a tap target.
// A temporary wordmark until the real logo arrives. It takes the colour of the text around it,
// so it works on white, on dark mode, and on the admin's black sidebar.
const SIZES = {
  sm: { box: "size-6", text: "text-base" },
  md: { box: "size-7", text: "text-xl" },
  lg: { box: "size-10", text: "text-3xl" },
};

export function Wordmark({ size = "md", mark = true, text = true, className }) {
  const s = SIZES[size] ?? SIZES.md;
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", s.text, className)}>
      {mark && (
        <svg viewBox="0 0 28 28" className={cn(s.box, "shrink-0")} aria-hidden="true">
          <rect width="28" height="28" rx="8" fill="currentColor" />
          <circle cx="14" cy="14" r="5" style={{ fill: "var(--wordmark-dot, var(--background))" }} />
        </svg>
      )}
      {text ? <span>Koetap</span> : <span className="sr-only">Koetap</span>}
    </span>
  );
}
