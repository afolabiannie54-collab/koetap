import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import { reportContext } from "@/lib/report-api";
import { previousRange, round2 } from "@/lib/reports";

export async function GET(request, { params }) {
  const { store, range, error } = await reportContext(request, params);
  if (error) return error;

  const prev = previousRange(range);

  // One pass over both periods: the previous period ends the millisecond before this one
  // starts, so a single $match covers them and $cond sorts each sale into its period.
  const rows = await Sale.aggregate([
    { $match: { storeId: store._id, createdAt: { $gte: prev.from, $lte: range.to } } },
    {
      $group: {
        _id: { $cond: [{ $gte: ["$createdAt", range.from] }, "current", "previous"] },
        revenue: { $sum: "$total" },
        transactions: { $sum: 1 },
        itemsSold: { $sum: { $sum: "$items.quantity" } },
      },
    },
  ]);

  const pick = (period) => {
    const r = rows.find((row) => row._id === period);
    const revenue = round2(r?.revenue ?? 0);
    const transactions = r?.transactions ?? 0;
    return {
      revenue,
      transactions,
      avgOrderValue: transactions ? round2(revenue / transactions) : 0,
      itemsSold: r?.itemsSold ?? 0,
    };
  };
  const cur = pick("current");
  const old = pick("previous");

  return NextResponse.json({
    ...cur,
    previousRevenue: old.revenue,
    previousTransactions: old.transactions,
    previousAvgOrderValue: old.avgOrderValue,
    previousItemsSold: old.itemsSold,
  });
}
