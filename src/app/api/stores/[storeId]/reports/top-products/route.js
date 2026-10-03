import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import { reportContext, salesMatch } from "@/lib/report-api";
import { round2 } from "@/lib/reports";

export async function GET(request, { params }) {
  const { store, range, error } = await reportContext(request, params);
  if (error) return error;

  const rows = await Sale.aggregate([
    salesMatch(store, range.from, range.to),
    // Oldest first, so $last below gives the name from the most recent sale (products get renamed).
    { $sort: { createdAt: 1 } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        name: { $last: "$items.name" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" },
      },
    },
    { $sort: { unitsSold: -1, revenue: -1, name: 1 } },
    { $limit: 10 },
  ]);

  return NextResponse.json(
    rows.map((r) => ({
      productId: r._id?.toString() ?? null,
      name: r.name,
      unitsSold: r.unitsSold,
      revenue: round2(r.revenue),
    }))
  );
}
