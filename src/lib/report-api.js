import { NextResponse } from "next/server";
import { authorizeStore } from "@/lib/api-auth";
import { parseRange } from "@/lib/reports";

// Shared start for every report route: only owners/superadmins of the store get in (cashiers must
// never see revenue), and the from/to query params are validated.
// Returns { store, range, searchParams } or { error } (a ready-to-return response).
export async function reportContext(request, params) {
  const { storeId } = await params;
  const { store, error } = await authorizeStore(storeId, { write: true });
  if (error) return { error };

  const searchParams = new URL(request.url).searchParams;
  const { range, error: rangeError } = parseRange(searchParams.get("from"), searchParams.get("to"));
  if (rangeError) {
    return { error: NextResponse.json({ error: rangeError }, { status: 400 }) };
  }

  return { store, range, searchParams };
}

// The filter every report starts from. storeId must be an ObjectId here: aggregation
// pipelines are not cast by Mongoose like find() queries are.
export const salesMatch = (store, from, to) => ({
  $match: { storeId: store._id, createdAt: { $gte: from, $lte: to } },
});
