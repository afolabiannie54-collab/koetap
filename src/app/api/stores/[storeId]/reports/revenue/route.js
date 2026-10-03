import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import { reportContext, salesMatch } from "@/lib/report-api";
import { TIMEZONE, chartInterval, fillBuckets } from "@/lib/reports";

// Revenue over time for the chart: hourly for a single day, daily otherwise.
export async function GET(request, { params }) {
  const { store, range, error } = await reportContext(request, params);
  if (error) return error;

  const interval = chartInterval(range);
  const format = interval === "hour" ? "%Y-%m-%dT%H" : "%Y-%m-%d";

  const rows = await Sale.aggregate([
    salesMatch(store, range.from, range.to),
    {
      $group: {
        _id: { $dateToString: { format, date: "$createdAt", timezone: TIMEZONE } },
        revenue: { $sum: "$total" },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return NextResponse.json({ interval, points: fillBuckets(rows, range, interval) });
}
