import { NextResponse } from "next/server";
import { sweepOrphanImages } from "@/lib/image-cleanup";

export const runtime = "nodejs";
export const maxDuration = 60;

// Runs on a schedule (see vercel.json). Vercel calls it with "Authorization: Bearer <CRON_SECRET>"; anything else
// is refused, so nobody can trigger it by visiting the address. Add ?dryRun=true to see what it would delete.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET isn't set on this server." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  try {
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
    return NextResponse.json(await sweepOrphanImages({ dryRun }));
  } catch (err) {
    console.error("Image cleanup failed:", err?.message ?? err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
