import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const HOME = { superadmin: "/admin", owner: "/dashboard", cashier: "/pos" };

// Which roles may enter each area. Owners' pages are also open to superadmins.
const PROTECTED = [
  { prefix: "/dashboard", roles: ["owner", "superadmin"] },
  { prefix: "/stores", roles: ["owner", "superadmin"] },
  { prefix: "/reports", roles: ["owner", "superadmin"] },
  { prefix: "/settings", roles: ["owner", "superadmin"] },
  { prefix: "/admin", roles: ["superadmin"] },
  // Owners open a store's POS from the store page. Which store is checked below (cashiers) and
  // in the page and API (owners: the store must belong to their business).
  { prefix: "/pos", roles: ["cashier", "owner", "superadmin"] },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const role = user?.role;
  const home = HOME[role];

  // A suspended business can't use the app at all: every page is /suspended until it's reinstated.
  if (user?.suspended) {
    return pathname === "/suspended"
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/suspended", req.url));
  }
  if (pathname === "/suspended") {
    return NextResponse.redirect(new URL(home ?? "/login", req.url));
  }

  // Google sign-ups must name their business before using anything else.
  // (=== false so sessions issued before this flag existed aren't bounced.)
  // (A super admin has no business to name, so is never sent to setup.)
  if (user && user.setupComplete === false && role !== "superadmin") {
    return pathname === "/setup"
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/setup", req.url));
  }

  if (pathname === "/setup") {
    return NextResponse.redirect(new URL(home ?? "/login", req.url));
  }

  // Signed-in users have no business on the auth pages.
  if (pathname === "/login" || pathname === "/register") {
    return home ? NextResponse.redirect(new URL(home, req.url)) : NextResponse.next();
  }

  const rule = PROTECTED.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  if (!rule) return NextResponse.next();

  if (!req.auth) return NextResponse.redirect(new URL("/login", req.url));
  if (!rule.roles.includes(role)) {
    return NextResponse.redirect(new URL(home ?? "/login", req.url));
  }

  // A cashier may only open the POS of their own store.
  if (rule.prefix === "/pos" && role === "cashier") {
    const target = pathname.split("/")[2];
    if (target && target !== user.storeId) return NextResponse.redirect(new URL("/pos", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Every page, so the setup redirect applies everywhere. API routes, Next internals and static files are skipped.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
