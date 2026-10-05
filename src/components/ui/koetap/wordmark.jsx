import { LogoIllustration } from "@/components/ui/koetap/logo-illustration";
import { cn } from "@/lib/utils";

// The Koetap logo (the cashier avatar) beside the name in DM Sans bold. It is drawn in the surrounding
// text colour, so it works on white, in dark mode, and on the admin's black sidebar.
// text={false} shows the avatar alone (the collapsed sidebar).
const SIZES = {
  sm: { mark: "h-8", text: "text-xl" },
  md: { mark: "h-10", text: "text-2xl" },
  lg: { mark: "h-14", text: "text-3xl" },
};

export function Wordmark({ size = "md", mark = true, text = true, className }) {
  const s = SIZES[size] ?? SIZES.md;
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", s.text, className)}>
      {mark && <LogoIllustration className={cn(s.mark, "w-auto shrink-0")} />}
      {text ? <span>Koetap</span> : <span className="sr-only">Koetap</span>}
    </span>
  );
}
