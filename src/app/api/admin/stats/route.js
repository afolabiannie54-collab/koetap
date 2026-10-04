import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/admin-api";
import { getPlatformStats } from "@/lib/admin-data";

export async function GET() {
  const { error } = await requireSuperadmin();
  if (error) return error;

  return NextResponse.json(await getPlatformStats());
}
