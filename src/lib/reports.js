// Reports use one timezone for every date boundary and bucket. UTC for now; this is the only
// place to change when stores get their own timezone (the aggregations read TIMEZONE too).
export const TIMEZONE = "UTC";

export const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

export const PRESETS = ["today", "week", "month", "lastMonth", "custom"];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const startOfUtcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);
export const toDateString = (d) => d.toISOString().slice(0, 10);
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// "2026-10-01" or a full ISO timestamp -> a Date, or null if it isn't one.
function parseDateInput(value) {
  if (typeof value !== "string" || !value) return null;
  if (!DATE_ONLY.test(value) && !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // Round-trip check so "2026-02-31" isn't silently turned into 3 March.
  if (DATE_ONLY.test(value) && toDateString(d) !== value) return null;
  return d;
}

// from -> 00:00:00.000 of that day, to -> 23:59:59.999 of that day (in TIMEZONE).
export function parseRange(fromValue, toValue) {
  const fromDate = parseDateInput(fromValue);
  const toDate = parseDateInput(toValue);
  if (!fromDate || !toDate) {
    return { error: "from and to are required, as dates like 2026-10-01" };
  }

  const from = startOfUtcDay(fromDate);
  const to = new Date(startOfUtcDay(toDate).getTime() + DAY_MS - 1);

  if (from > to) return { error: "from must be on or before to" };

  const days = Math.round((to.getTime() + 1 - from.getTime()) / DAY_MS);
  if (days > MAX_RANGE_DAYS) {
    return { error: `The date range can be at most ${MAX_RANGE_DAYS} days` };
  }

  return { range: { from, to, days } };
}

// The period of equal length immediately before this one, so "this month so far" is compared
// with the same number of days before it rather than with a whole finished month.
export function previousRange({ from, days }) {
  const prevFrom = addDays(from, -days);
  const prevTo = new Date(from.getTime() - 1);
  return { from: prevFrom, to: prevTo, days };
}

// Single day -> hourly chart; anything longer -> daily.
export const chartInterval = (range) => (range.days === 1 ? "hour" : "day");

// The aggregation returns only buckets that had sales. Fill the gaps with zeros so the chart
// is a continuous line instead of jumping over quiet days.
export function fillBuckets(rows, range, interval) {
  const byKey = new Map(rows.map((r) => [r._id, r]));
  const out = [];

  if (interval === "hour") {
    const day = toDateString(range.from);
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, "0");
      const row = byKey.get(`${day}T${hh}`);
      out.push({ key: `${day}T${hh}`, label: `${hh}:00`, revenue: round2(row?.revenue ?? 0), transactions: row?.transactions ?? 0 });
    }
    return out;
  }

  for (let d = range.from; d <= range.to; d = addDays(d, 1)) {
    const key = toDateString(d);
    const row = byKey.get(key);
    out.push({ key, label: key, revenue: round2(row?.revenue ?? 0), transactions: row?.transactions ?? 0 });
  }
  return out;
}

// ---- Presets (used by the page, with "today" supplied by the server) ----

// today: "YYYY-MM-DD". Weeks start on Monday.
export function presetRange(preset, today) {
  const t = startOfUtcDay(new Date(`${today}T00:00:00Z`));

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const sinceMonday = (t.getUTCDay() + 6) % 7;
      return { from: toDateString(addDays(t, -sinceMonday)), to: today };
    }
    case "month":
      return { from: toDateString(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1))), to: today };
    case "lastMonth":
      return {
        from: toDateString(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1))),
        to: toDateString(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0))),
      };
    default:
      return null;
  }
}

// Percentage change of current vs previous, or null when there's nothing to compare with.
export function percentChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}
