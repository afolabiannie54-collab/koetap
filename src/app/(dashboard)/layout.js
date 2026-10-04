import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { name, email } = session.user;

  return <DashboardShell user={{ name, email }}>{children}</DashboardShell>;
}
