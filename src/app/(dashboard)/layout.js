import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { name, email, role } = session.user;

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Mobile top bar */}
      <header className="flex flex-col gap-3 bg-slate-900 px-4 py-3 md:hidden">
        <span className="text-lg font-semibold tracking-tight text-white">Koetap</span>
        <SidebarNav orientation="horizontal" />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 md:flex">
        <div className="px-6 py-5">
          <span className="text-xl font-semibold tracking-tight text-white">Koetap</span>
        </div>
        <div className="flex-1 px-3">
          <SidebarNav />
        </div>
        <div className="flex items-center gap-3 border-t border-slate-800 px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
            {(name || email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{name || "Account"}</p>
            <p className="truncate text-xs text-slate-400">{email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>

      {/* Mobile sign-out, since the sidebar footer is hidden on small screens */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 md:hidden">
        <span className="truncate text-sm text-slate-300">
          {email} · {role}
        </span>
        <SignOutButton />
      </div>
    </div>
  );
}
