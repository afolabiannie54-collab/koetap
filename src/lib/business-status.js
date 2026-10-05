import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Business from "@/models/Business";

// Every request for an owner or cashier asks "is my business suspended?", from the proxy, the
// page and the API. A short cache keeps that to about one lookup per business every few seconds,
// and a suspension still reaches everyone within that window.
const TTL_MS = 5000;
const cache = new Map(); // businessId -> { state, at }   state: "active" | "suspended" | "gone"

// "active", "suspended", or "gone" (the business was deleted). Business.isActive is missing on older documents,
// and those count as active. Pass fresh: true (e.g. at sign-in) to skip the cache.
export async function getBusinessState(businessId, { fresh = false } = {}) {
  if (!businessId || !mongoose.isValidObjectId(businessId)) return "active";

  const key = String(businessId);
  const hit = cache.get(key);
  if (!fresh && hit && Date.now() - hit.at < TTL_MS) return hit.state;

  await connectDB();
  const business = await Business.findById(key).select("isActive").lean();
  const state = !business ? "gone" : business.isActive === false ? "suspended" : "active";
  cache.set(key, { state, at: Date.now() });
  return state;
}

export async function isBusinessSuspended(businessId, options) {
  return (await getBusinessState(businessId, options)) === "suspended";
}

// Called after the admin changes a business, so this server instance sees it immediately.
export function forgetBusinessStatus(businessId) {
  cache.delete(String(businessId));
}
