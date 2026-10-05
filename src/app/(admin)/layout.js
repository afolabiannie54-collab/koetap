import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSignOut } from "@/components/admin/admin-sign-out";
import { ThemeToggle } from "@/components/ui/koetap/theme-toggle";
import { Wordmark } from "@/components/ui/koetap/wordmark";

export const metadata = { title: "Admin | Koetap" };

const HOME = { owner: "/dashboard", cashier: "/pos" };

const ADMIN_TAG = (
  <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#0A0A0A] uppercase">Admin</span>
);

// The platform owner's internal tool. The sidebar is near-black in light and dark mode alike, so it's
// obvious which shell you're in. The content area follows the theme.
export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // The proxy already keeps everyone else out; this is the second lock.
  if (session.user.role !== "superadmin") redirect(HOME[session.user.role] ?? "/login");
  const { name, email } = session.user;

  return (
    <div className="flex min-h-screen flex-col bg-canvas md:flex-row">
      {/* Phone top bar */}
      <header className="flex flex-col gap-3 bg-[#0A0A0A] px-4 py-3 text-white md:hidden">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wordmark size="sm" className="text-white" />
            {ADMIN_TAG}
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" tipSide="bottom" tipAlign="end" />
            <AdminSignOut tipSide="bottom" />
          </div>
        </div>
        <AdminNav orientation="horizontal" />
      </header>

      <AdminSidebar name={name} email={email} />

      <main className="min-w-0 flex-1 bg-canvas p-4 sm:p-6 md:p-10">{children}</main>
    </div>
  );
}
