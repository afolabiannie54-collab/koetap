import { Wordmark } from "@/components/ui/koetap/wordmark";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";

// The centered white card on a light grey page that every sign-in screen shares.
export function AuthShell({ children, heading, subtext, footer }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-grey-100 px-4 py-10 dark:bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fadeIn rounded-2xl border border-border bg-card p-8 shadow-md sm:p-10">
        <div className="mb-8 flex justify-center">
          <Wordmark size="md" />
        </div>

        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          {subtext && <p className="mt-1.5 text-sm text-muted-foreground">{subtext}</p>}
        </div>

        {children}
      </div>

      {footer && <div className="mt-6 max-w-md px-4 text-center text-xs text-muted-foreground">{footer}</div>}
    </main>
  );
}
