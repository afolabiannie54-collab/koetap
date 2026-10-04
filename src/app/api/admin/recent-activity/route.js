import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/admin-api";
import { getRecentActivity } from "@/lib/admin-data";

// The 10 newest sales across the whole platform.
export async function GET() {
  const { error } = await requireSuperadmin();
  if (error) return error;

  return NextResponse.json({ sales: await getRecentActivity(10) });
}
