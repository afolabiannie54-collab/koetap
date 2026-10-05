import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import { lowStockExpr } from "@/lib/products";
import { percentChange, round2, toDateString } from "@/lib/reports";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

// "5 minutes ago", "3 hours ago", "2 days ago". Worked out on the server when the page is built.
export function relativeTime(date, now = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

// Everything the dashboard and a store's overview show, for one or more stores, in a handful of queries.
//   stores: [{ id, name, currency, lowStockThreshold }]
// Days are UTC days, like the reports, so "today" here means the same as "Today" there.
export async function getOverview(stores, { recentLimit = 8 } = {}) {
  await connectDB();
  const ids = stores.map((s) => new mongoose.Types.ObjectId(s.id));
  const storeName = new Map(stores.map((s) => [s.id, s.name]));

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);

  const [perDay, recent, lowByStore] = await Promise.all([
    // One row per day with sales, for the last 7 days (today and yesterday come out of this too)
    Sale.aggregate([
      { $match: { storeId: { $in: ids }, createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          revenue: { $sum: "$total" },
          sales: { $sum: 1 },
          items: { $sum: { $sum: "$items.quantity" } },
        },
      },
    ]),
    Sale.find({ storeId: { $in: ids } }).sort({ createdAt: -1 }).limit(recentLimit).lean(),
    // Each store has its own default "low" level, so ask store by store (there are only a few)
    Promise.all(
      stores.map((s) =>
        Product.find({
          storeId: new mongoose.Types.ObjectId(s.id),
          isActive: true,
          $expr: lowStockExpr(s.lowStockThreshold),
        })
          .sort({ stock: 1, name: 1 })
          .limit(50)
          .lean()
      )
    ),
  ]);

  const byDay = new Map(perDay.map((r) => [r._id, r]));
  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = toDateString(new Date(weekStart.getTime() + i * DAY_MS));
    week.push({ label: day, revenue: round2(byDay.get(day)?.revenue ?? 0) });
  }

  const today = byDay.get(toDateString(todayStart));
  const yesterday = byDay.get(toDateString(new Date(todayStart.getTime() - DAY_MS)));
  const todayRevenue = round2(today?.revenue ?? 0);
  const yesterdayRevenue = round2(yesterday?.revenue ?? 0);

  const lowStock = lowByStore
    .flatMap((list, i) => list.map((p) => ({ id: p._id.toString(), name: p.name, stock: p.stock, storeId: stores[i].id, storeName: stores[i].name })))
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));

  return {
    today: { revenue: todayRevenue, sales: today?.sales ?? 0, items: today?.items ?? 0 },
    revenueChange: percentChange(todayRevenue, yesterdayRevenue),
    week,
    recentSales: recent.map((s) => ({
      id: s._id.toString(),
      storeId: s.storeId.toString(),
      storeName: storeName.get(s.storeId.toString()) ?? "",
      cashierName: s.cashierName,
      total: s.total,
      paymentMethod: s.paymentMethod,
      itemCount: (s.items ?? []).reduce((n, i) => n + (i.quantity ?? 0), 0),
      when: relativeTime(s.createdAt, now),
    })),
    lowStock: lowStock.slice(0, 6),
    lowStockCount: lowStock.length,
  };
}
