import { AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";
import { Wordmark } from "@/components/ui/koetap/wordmark";
import { SuspendedSignOut } from "./suspended-sign-out";

export const metadata = { title: "Account suspended | Koetap" };

// Deliberately bare: no navigation. The proxy sends every page here while a business is suspended.
export default function SuspendedPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-grey-100 px-4 dark:bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fadeIn rounded-2xl border border-border bg-card p-8 text-center shadow-md sm:p-10">
        <div className="mb-8 flex justify-center">
          <Wordmark size="md" />
        </div>
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-error-soft text-error-ink">
          <AlertTriangle className="size-8" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Account suspended</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account has been suspended. Please contact{" "}
          <a href="mailto:support@koetap.com" className="font-semibold text-foreground underline-offset-4 hover:underline">
            support@koetap.com
          </a>{" "}
          for assistance.
        </p>
        <SuspendedSignOut />
      </div>
    </main>
  );
}
