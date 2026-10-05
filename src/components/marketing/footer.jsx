import Link from "next/link";
import { Wordmark } from "@/components/ui/koetap/wordmark";

export function MarketingFooter() {
  return (
    <footer className="border-t-2 border-foreground bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <Wordmark size="md" />
            <p className="mt-5 max-w-xs text-lg font-semibold tracking-tight text-muted-foreground">Built for African businesses.</p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3 text-base font-bold">
            <Link href="/how-it-works" className="underline-offset-8 hover:underline">How it Works</Link>
            <Link href="/faq" className="underline-offset-8 hover:underline">FAQ</Link>
            <Link href="/login" className="underline-offset-8 hover:underline">Sign In</Link>
            <Link href="/register" className="underline-offset-8 hover:underline">Get Started</Link>
          </nav>
        </div>

        <p className="mt-14 text-sm text-muted-foreground">&copy; 2026 Koetap. All rights reserved.</p>
      </div>
    </footer>
  );
}
