"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/ui/koetap/chart-tooltip";
import { formatMoney } from "@/lib/stores";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

// "2026-10-03" -> "3 Oct". Hourly labels ("14:00") are shown as they are.
const shortDate = (label) =>
  /^\d{4}-\d{2}-\d{2}$/.test(label)
    ? new Date(`${label}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
    : label;

// Colours are CSS variables, so the chart follows light and dark mode without any extra code.
const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" };

export function RevenueChart({ points, interval, currency, color = "var(--foreground)" }) {
  return (
    <div className="h-72 w-full" role="img" aria-label={`Revenue ${interval === "hour" ? "by hour" : "by day"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickFormatter={shortDate} tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={24} />
          <YAxis tickFormatter={(v) => compact.format(v)} tickLine={false} axisLine={false} width={48} tick={AXIS_TICK} />
          <Tooltip
            cursor={{ stroke: "var(--input)" }}
            content={
              <ChartTooltip
                valueLabel="revenue"
                formatValue={(v) => formatMoney(v, currency)}
                formatLabel={(l) => (interval === "hour" ? `${l} (UTC)` : shortDate(l))}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={color}
            strokeWidth={2.5}
            dot={points.length <= 31 ? { r: 3, fill: color, strokeWidth: 0 } : false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
