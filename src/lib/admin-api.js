import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Every admin route starts here. Only the platform's superadmin gets through: not signed in is a
// 401, and any other role (owner, cashier) is a 403.
export async function requireSuperadmin() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
