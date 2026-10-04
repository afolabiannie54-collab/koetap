"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/koetap/avatar";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";
import { Wordmark } from "@/components/ui/koetap/wordmark";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { TopBarSlot, TopBarSlotProvider } from "@/components/dashboard/topbar";

const TITLES = [
  ["/dashboard", "Dashboard"],
  ["/stores", "Stores"],
  ["/reports", "Reports"],
  ["/settings", "Settings"],
];

function UserMenu({ user }) {
  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} email={user.email} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name || "Account"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </div>
  );
}

// The Koetap shell: a 240px white sidebar, a 56px top bar with the page title on the left and a slot for
// the page's buttons on the right, and the page itself in a comfortably padded column.
// Below 1024px the sidebar becomes a drawer behind the menu button.
export function DashboardShell({ user, children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? "Koetap";

  return (
    <TopBarSlotProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <div className="flex h-14 items-center px-5">
            <Wordmark size="md" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav />
          </div>
          <UserMenu user={user} />
        </aside>

        {/* Mobile drawer */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Main navigation</SheetDescription>
            <div className="flex h-14 items-center px-5">
              <Wordmark size="md" />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarNav onNavigate={() => setMenuOpen(false)} />
            </div>
            <UserMenu user={user} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
            <p className="text-lg font-semibold tracking-tight">{title}</p>
            <TopBarSlot className="ml-auto flex items-center gap-2" />
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </TopBarSlotProvider>
  );
}
