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
  { prefix: "/pos", roles: ["cashier"] },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const role = user?.role;
  const home = HOME[role];

  // Google sign-ups must name their business before using anything else.
  // (=== false so sessions issued before this flag existed aren't bounced.)
  if (user && user.setupComplete === false) {
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
  return NextResponse.next();
});

export const config = {
  // Every page, so the setup redirect applies everywhere. API routes, Next internals and static files are skipped.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
