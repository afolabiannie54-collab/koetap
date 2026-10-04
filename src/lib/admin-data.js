import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Business from "@/models/Business";
import Store from "@/models/Store";
import Sale from "@/models/Sale";
import User from "@/models/User";
import { TIMEZONE, round2, toDateString } from "@/lib/reports";

// All the platform-wide numbers come from the database (counts and aggregation pipelines);
// nothing here loads whole collections to add them up in JS.
// Owner details are always projected field by field (name, email), so a password hash can't leak.

const DAY_MS = 24 * 60 * 60 * 1000;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- overview ----------

export async function getPlatformStats(now = new Date()) {
  await connectDB();

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const from = new Date(today.getTime() - 29 * DAY_MS); // today and the 29 days before it

  const [totalBusinesses, totalStores, salesTotals, newBusinessesThisMonth, activeCashiers, signups] =
    await Promise.all([
      Business.countDocuments(),
      Store.countDocuments({ isActive: { $ne: false } }),
      Sale.aggregate([{ $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$total" } } }]),
      Business.countDocuments({ createdAt: { $gte: monthStart } }),
      User.countDocuments({ role: "cashier", isActive: true }),
      Business.aggregate([
        { $match: { createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TIMEZONE } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  // Days without signups come back as nothing from the pipeline; fill them with zero for the chart.
  const byDay = new Map(signups.map((s) => [s._id, s.count]));
  const signupsLast30Days = [];
  for (let d = from; d <= today; d = new Date(d.getTime() + DAY_MS)) {
    const date = toDateString(d);
    signupsLast30Days.push({ date, count: byDay.get(date) ?? 0 });
  }

  return {
    totalBusinesses,
    totalStores,
    totalSales: salesTotals[0]?.count ?? 0,
    totalRevenue: round2(salesTotals[0]?.revenue ?? 0),
    newBusinessesThisMonth,
    activeCashiers,
    signupsLast30Days,
  };
}

export async function getRecentActivity(limit = 10) {
  await connectDB();

  const rows = await Sale.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    { $lookup: { from: "stores", localField: "storeId", foreignField: "_id", pipeline: [{ $project: { name: 1, currency: 1 } }], as: "store" } },
    { $lookup: { from: "businesses", localField: "businessId", foreignField: "_id", pipeline: [{ $project: { name: 1 } }], as: "business" } },
    {
      $project: {
        createdAt: 1,
        total: 1,
        cashierName: 1,
        paymentMethod: 1,
        store: { $first: "$store" },
        business: { $first: "$business" },
      },
    },
  ]);

  return rows.map((s) => ({
    _id: s._id.toString(),
    createdAt: s.createdAt,
    total: round2(s.total),
    currency: s.store?.currency ?? "NGN",
    cashierName: s.cashierName,
    paymentMethod: s.paymentMethod,
    storeId: s.store?._id?.toString() ?? null,
    storeName: s.store?.name ?? "Deleted store",
    businessId: s.business?._id?.toString() ?? null,
    businessName: s.business?.name ?? "Deleted business",
  }));
}

// ---------- businesses ----------

export async function listBusinesses({ search = "", plan = "all", status = "all", page = 1, limit = 25 } = {}) {
  await connectDB();

  const match = {};
  // A business with no plan field counts as free.
  if (plan === "paid") match.plan = "paid";
  else if (plan === "free") match.plan = { $ne: "paid" };
  // A business with no isActive field counts as active.
  if (status === "active") match.isActive = { $ne: false };
  else if (status === "inactive") match.isActive = false;

  const pipeline = [
    { $match: match },
    { $lookup: { from: "users", localField: "ownerId", foreignField: "_id", pipeline: [{ $project: { name: 1, email: 1 } }], as: "owner" } },
    { $addFields: { owner: { $first: "$owner" } } },
  ];

  const term = search.trim();
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    pipeline.push({ $match: { $or: [{ name: rx }, { "owner.email": rx }] } });
  }

  pipeline.push(
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        // The per-business counts are only worked out for the rows on this page.
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $lookup: { from: "stores", localField: "_id", foreignField: "businessId", pipeline: [{ $group: { _id: null, count: { $sum: 1 } } }], as: "storeStats" } },
          { $lookup: { from: "sales", localField: "_id", foreignField: "businessId", pipeline: [{ $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$total" } } }], as: "saleStats" } },
          {
            $project: {
              name: 1,
              plan: 1,
              isActive: 1,
              createdAt: 1,
              ownerName: "$owner.name",
              ownerEmail: "$owner.email",
              stores: { $ifNull: [{ $first: "$storeStats.count" }, 0] },
              totalSales: { $ifNull: [{ $first: "$saleStats.count" }, 0] },
              totalRevenue: { $ifNull: [{ $first: "$saleStats.revenue" }, 0] },
            },
          },
        ],
        count: [{ $count: "n" }],
      },
    }
  );

  const [result] = await Business.aggregate(pipeline);
  const total = result.count[0]?.n ?? 0;

  return {
    businesses: result.rows.map((b) => ({
      _id: b._id.toString(),
      name: b.name,
      ownerName: b.ownerName ?? "",
      ownerEmail: b.ownerEmail ?? "",
      plan: b.plan ?? "free",
      isActive: b.isActive !== false,
      createdAt: b.createdAt,
      stores: b.stores,
      totalSales: b.totalSales,
      totalRevenue: round2(b.totalRevenue),
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getBusinessDetail(businessId) {
  if (!mongoose.isValidObjectId(businessId)) return null;
  await connectDB();

  const id = new mongoose.Types.ObjectId(businessId);
  const business = await Business.findById(id).lean();
  if (!business) return null;

  const [owner, stores, recentSales, totals] = await Promise.all([
    User.findById(business.ownerId).select("name email").lean(),
    Store.aggregate([
      { $match: { businessId: id } },
      { $sort: { createdAt: 1 } },
      { $lookup: { from: "products", localField: "_id", foreignField: "storeId", pipeline: [{ $match: { isActive: { $ne: false } } }, { $count: "n" }], as: "productStats" } },
      { $lookup: { from: "users", localField: "_id", foreignField: "storeId", pipeline: [{ $match: { role: "cashier", isActive: true } }, { $count: "n" }], as: "staffStats" } },
      { $lookup: { from: "sales", localField: "_id", foreignField: "storeId", pipeline: [{ $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$total" } } }], as: "saleStats" } },
      {
        $project: {
          name: 1,
          currency: 1,
          isActive: 1,
          products: { $ifNull: [{ $first: "$productStats.n" }, 0] },
          staff: { $ifNull: [{ $first: "$staffStats.n" }, 0] },
          totalSales: { $ifNull: [{ $first: "$saleStats.count" }, 0] },
          totalRevenue: { $ifNull: [{ $first: "$saleStats.revenue" }, 0] },
        },
      },
    ]),
    Sale.aggregate([
      { $match: { businessId: id } },
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
      { $lookup: { from: "stores", localField: "storeId", foreignField: "_id", pipeline: [{ $project: { name: 1, currency: 1 } }], as: "store" } },
      { $project: { createdAt: 1, total: 1, cashierName: 1, paymentMethod: 1, store: { $first: "$store" } } },
    ]),
    Sale.aggregate([{ $match: { businessId: id } }, { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$total" } } }]),
  ]);

  return {
    business: {
      _id: business._id.toString(),
      name: business.name,
      email: business.email ?? "",
      phone: business.phone ?? "",
      plan: business.plan ?? "free",
      isActive: business.isActive !== false,
      createdAt: business.createdAt,
    },
    owner: owner ? { _id: owner._id.toString(), name: owner.name, email: owner.email } : null,
    totals: { totalSales: totals[0]?.count ?? 0, totalRevenue: round2(totals[0]?.revenue ?? 0) },
    stores: stores.map((s) => ({
      _id: s._id.toString(),
      name: s.name,
      currency: s.currency ?? "NGN",
      isActive: s.isActive !== false,
      products: s.products,
      staff: s.staff,
      totalSales: s.totalSales,
      totalRevenue: round2(s.totalRevenue),
    })),
    recentSales: recentSales.map((s) => ({
      _id: s._id.toString(),
      createdAt: s.createdAt,
      total: round2(s.total),
      currency: s.store?.currency ?? "NGN",
      cashierName: s.cashierName,
      paymentMethod: s.paymentMethod,
      storeName: s.store?.name ?? "Deleted store",
    })),
  };
}
