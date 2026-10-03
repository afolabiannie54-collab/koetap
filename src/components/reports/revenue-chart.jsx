"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/stores";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

// "2026-10-03" -> "3 Oct". Hourly labels ("14:00") are shown as they are.
const shortDate = (label) =>
  /^\d{4}-\d{2}-\d{2}$/.test(label)
    ? new Date(`${label}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
    : label;

export function RevenueChart({ points, interval, currency, color }) {
  return (
    <div className="h-72 w-full" role="img" aria-label={`Revenue ${interval === "hour" ? "by hour" : "by day"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v) => compact.format(v)}
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <Tooltip
            formatter={(value) => [formatMoney(value, currency), "Revenue"]}
            labelFormatter={(label) => (interval === "hour" ? `${label} (UTC)` : shortDate(label))}
            contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb", fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={color}
            strokeWidth={2.5}
            dot={points.length <= 31 ? { r: 3, fill: color } : false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
