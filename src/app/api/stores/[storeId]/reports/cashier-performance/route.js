import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import { reportContext, salesMatch } from "@/lib/report-api";
import { round2 } from "@/lib/reports";

export async function GET(request, { params }) {
  const { store, range, error } = await reportContext(request, params);
  if (error) return error;

  const rows = await Sale.aggregate([
    salesMatch(store, range.from, range.to),
    // Oldest first, so $last gives the name the cashier is currently using.
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: "$cashierId",
        cashierName: { $last: "$cashierName" },
        transactions: { $sum: 1 },
        revenue: { $sum: "$total" },
      },
    },
    { $addFields: { avgOrderValue: { $divide: ["$revenue", "$transactions"] } } },
    { $sort: { revenue: -1, cashierName: 1 } },
  ]);

  return NextResponse.json(
    rows.map((r) => ({
      cashierId: r._id?.toString() ?? null,
      cashierName: r.cashierName,
      transactions: r.transactions,
      revenue: round2(r.revenue),
      avgOrderValue: round2(r.avgOrderValue),
    }))
  );
}
