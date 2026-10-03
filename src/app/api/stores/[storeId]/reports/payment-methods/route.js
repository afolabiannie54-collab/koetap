import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import { reportContext, salesMatch } from "@/lib/report-api";
import { round2 } from "@/lib/reports";
import { PAYMENT_METHODS } from "@/lib/pos";

// Always returns all three methods (zero if unused) so the breakdown has a stable shape.
export async function GET(request, { params }) {
  const { store, range, error } = await reportContext(request, params);
  if (error) return error;

  const rows = await Sale.aggregate([
    salesMatch(store, range.from, range.to),
    { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$total" } } },
  ]);

  const methods = PAYMENT_METHODS.map((method) => {
    const r = rows.find((row) => row._id === method);
    return { method, count: r?.count ?? 0, revenue: round2(r?.revenue ?? 0) };
  });
  const totalCount = methods.reduce((n, m) => n + m.count, 0);

  return NextResponse.json({
    total: totalCount,
    methods: methods.map((m) => ({
      ...m,
      percentage: totalCount ? Math.round((m.count / totalCount) * 1000) / 10 : 0,
    })),
  });
}
