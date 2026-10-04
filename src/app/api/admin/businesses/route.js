import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/admin-api";
import { listBusinesses } from "@/lib/admin-data";

const MAX_LIMIT = 100;
const PLANS = ["all", "free", "paid"];
const STATUSES = ["all", "active", "inactive"];

const positiveInt = (value, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
};

export async function GET(request) {
  const { error } = await requireSuperadmin();
  if (error) return error;

  const sp = new URL(request.url).searchParams;
  const plan = sp.get("plan") ?? "all";
  const status = sp.get("status") ?? "all";
  if (!PLANS.includes(plan)) {
    return NextResponse.json({ error: "plan must be all, free or paid" }, { status: 400 });
  }
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "status must be all, active or inactive" }, { status: 400 });
  }

  const result = await listBusinesses({
    search: (sp.get("search") ?? "").slice(0, 100),
    plan,
    status,
    page: positiveInt(sp.get("page"), 1),
    limit: Math.min(positiveInt(sp.get("limit"), 25), MAX_LIMIT),
  });

  return NextResponse.json(result);
}
