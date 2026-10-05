import { auth } from "@/lib/auth";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";

const HOME = { superadmin: "/admin", owner: "/dashboard", cashier: "/pos" };

// The public website: its own nav and footer, separate from the dashboard and the store environment.
// Someone who is already signed in gets a button to their own home instead of Sign In / Get Started.
export default async function MarketingLayout({ children }) {
  const session = await auth();
  const home = session?.user ? HOME[session.user.role] ?? null : null;

  return (
    <div className="force-light isolate min-h-screen animate-fadeIn">
      <MarketingNav home={home} />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
