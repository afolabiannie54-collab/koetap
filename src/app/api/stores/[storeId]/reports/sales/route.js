import { NextResponse } from "next/server";
import Sale from "@/models/Sale";
import { reportContext, salesMatch } from "@/lib/report-api";
import { round2 } from "@/lib/reports";

const MAX_LIMIT = 100;

const positiveInt = (value, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
};

export async function GET(request, { params }) {
  const { store, range, searchParams, error } = await reportContext(request, params);
  if (error) return error;

  const page = positiveInt(searchParams.get("page"), 1);
  const limit = Math.min(positiveInt(searchParams.get("limit"), 20), MAX_LIMIT);

  // One round trip: $facet returns this page's rows and the overall count together.
  const [result] = await Sale.aggregate([
    salesMatch(store, range.from, range.to),
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              createdAt: 1,
              cashierName: 1,
              items: 1,
              itemCount: { $sum: "$items.quantity" },
              subtotal: 1,
              discount: 1,
              total: 1,
              paymentMethod: 1,
              receiptSent: 1,
            },
          },
        ],
        count: [{ $count: "n" }],
      },
    },
  ]);

  const total = result.count[0]?.n ?? 0;

  return NextResponse.json({
    sales: result.rows.map((s) => ({
      _id: s._id.toString(),
      createdAt: s.createdAt,
      cashierName: s.cashierName,
      items: s.items.map((i) => ({
        productId: i.productId?.toString() ?? null,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        total: i.total,
      })),
      itemCount: s.itemCount,
      subtotal: round2(s.subtotal ?? 0),
      discount: round2(s.discount ?? 0),
      total: round2(s.total),
      paymentMethod: s.paymentMethod,
      receiptSent: Boolean(s.receiptSent),
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
