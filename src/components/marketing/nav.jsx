"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Wordmark } from "@/components/ui/koetap/wordmark";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it Works" },
  { href: "/faq", label: "FAQ" },
];

// Sticky top bar. Its bottom border fades in once the page has scrolled. `home` is where a signed-in visitor goes
// (their dashboard, POS or admin); without it the buttons are Sign In and Get Started.
export function MarketingNav({ home }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const first = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const primary = home ? { href: home, label: "Open Koetap" } : { href: "/register", label: "Get Started" };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/90 backdrop-blur-md transition-[border-color,box-shadow] duration-300",
        "border-b",
        scrolled ? "border-border shadow-sm" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Koetap home" className="rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
          <Wordmark size="sm" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-xl px-4 py-2 text-[15px] font-semibold transition-colors duration-150",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!home && (
            <Link href="/login" className="rounded-xl px-4 py-2 text-[15px] font-semibold text-muted-foreground transition-colors duration-150 hover:text-foreground">
              Sign In
            </Link>
          )}
          <Link href={primary.href} className="inline-flex h-10 items-center rounded-xl bg-foreground px-5 text-sm font-bold text-background transition-all duration-200 hover:bg-foreground/85 active:scale-[0.98]">
            {primary.label}
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" aria-label="Open menu" className="inline-flex size-11 items-center justify-center rounded-xl border-2 border-foreground md:hidden">
              <Menu className="size-5" strokeWidth={2.5} />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigate the Koetap website</SheetDescription>
            <div className="flex h-full flex-col px-5 pt-5 pb-8">
              <Wordmark size="sm" />
              <nav aria-label="Mobile" className="mt-10 flex flex-col gap-1">
                {LINKS.map((l) => (
                  <SheetClose asChild key={l.href}>
                    <Link href={l.href} className={cn("rounded-2xl px-4 py-3.5 text-2xl font-bold tracking-tight", pathname === l.href ? "bg-foreground text-background" : "hover:bg-accent")}>
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3">
                {!home && (
                  <SheetClose asChild>
                    <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-foreground font-bold">
                      Sign In
                    </Link>
                  </SheetClose>
                )}
                <SheetClose asChild>
                  <Link href={primary.href} className="inline-flex h-12 items-center justify-center rounded-xl bg-foreground font-bold text-background">
                    {primary.label}
                  </Link>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
