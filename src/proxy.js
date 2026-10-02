import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const HOME = { superadmin: "/admin", owner: "/dashboard", cashier: "/pos" };

const PROTECTED = [
  { prefix: "/dashboard", role: "owner" },
  { prefix: "/admin", role: "superadmin" },
  { prefix: "/pos", role: "cashier" },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const home = HOME[role];

  // Signed-in users have no business on the auth pages.
  if (pathname === "/login" || pathname === "/register") {
    return home ? NextResponse.redirect(new URL(home, req.url)) : NextResponse.next();
  }

  const rule = PROTECTED.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  if (!rule) return NextResponse.next();

  if (!req.auth) return NextResponse.redirect(new URL("/login", req.url));
  if (role !== rule.role) {
    return NextResponse.redirect(new URL(home ?? "/login", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/pos/:path*", "/login", "/register"],
};
