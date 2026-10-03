import Sale from "@/models/Sale";
import { reportContext, salesMatch } from "@/lib/report-api";
import { csvRow } from "@/lib/csv";
import { PAYMENT_LABELS } from "@/lib/pos";
import { round2, toDateString } from "@/lib/reports";

const HEADER = ["Date", "Time", "Cashier", "Items", "Subtotal", "Discount", "Total", "Payment Method", "Receipt Sent"];

// Every sale in the period, no pagination. Rows are streamed from a database cursor, so a long
// range doesn't have to fit in memory.
export async function GET(request, { params }) {
  const { store, range, error } = await reportContext(request, params);
  if (error) return error;

  const cursor = Sale.aggregate([
    salesMatch(store, range.from, range.to),
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $project: {
        createdAt: 1,
        cashierName: 1,
        items: 1,
        subtotal: 1,
        discount: 1,
        total: 1,
        paymentMethod: 1,
        receiptSent: 1,
      },
    },
  ]).cursor();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // The BOM makes Excel read the file as UTF-8 (names, currency symbols).
        controller.enqueue(encoder.encode("﻿" + csvRow(HEADER)));
        for await (const s of cursor) {
          const at = new Date(s.createdAt);
          controller.enqueue(
            encoder.encode(
              csvRow([
                toDateString(at),
                at.toISOString().slice(11, 19),
                s.cashierName,
                s.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
                round2(s.subtotal ?? 0),
                round2(s.discount ?? 0),
                round2(s.total),
                PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod,
                s.receiptSent ? "Yes" : "No",
              ])
            )
          );
        }
        controller.close();
      } catch (err) {
        console.error("Sales export failed:", err);
        controller.error(err);
      }
    },
    cancel() {
      cursor.close();
    },
  });

  const from = toDateString(range.from);
  const to = toDateString(range.to);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="koetap-sales-${from}_to_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
