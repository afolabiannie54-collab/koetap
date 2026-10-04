import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSignOut } from "@/components/admin/admin-sign-out";

export const metadata = { title: "Admin | Koetap" };

const HOME = { owner: "/dashboard", cashier: "/pos" };

// The platform owner's internal tool. Visually unlike the owner dashboard on purpose, so it's
// obvious which one you're in.
export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // The proxy already keeps everyone else out; this is the second lock.
  if (session.user.role !== "superadmin") redirect(HOME[session.user.role] ?? "/login");
  const { name, email } = session.user;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      {/* Phone top bar */}
      <header className="flex flex-col gap-3 border-b-4 border-amber-400 bg-amber-50 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <span className="font-semibold tracking-tight text-stone-950">
            Koetap <span className="ml-1 rounded bg-stone-950 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase">Admin</span>
          </span>
          <AdminSignOut />
        </div>
        <AdminNav orientation="horizontal" />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r-4 border-amber-400 bg-amber-50 md:flex">
        <div className="px-6 py-5">
          <span className="text-xl font-semibold tracking-tight text-stone-950">Koetap</span>
          <span className="ml-2 rounded bg-stone-950 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
            Admin
          </span>
          <p className="mt-1 text-xs text-stone-500">Internal platform tools</p>
        </div>
        <div className="flex-1 px-3">
          <AdminNav />
        </div>
        <div className="flex items-center gap-3 border-t border-amber-200 px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-950 text-sm font-semibold text-amber-400">
            {(name || email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-950">{name || "Super admin"}</p>
            <p className="truncate text-xs text-stone-500">{email}</p>
          </div>
          <AdminSignOut />
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
