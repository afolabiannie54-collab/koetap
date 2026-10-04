"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/ui/koetap/chart-tooltip";

const shortDate = (label) =>
  new Date(`${label}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

// Colours are CSS variables, so the chart follows light and dark mode.
const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" };

export function SignupsChart({ points }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="New business signups per day, last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={28} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={AXIS_TICK} />
          <Tooltip
            cursor={{ stroke: "var(--input)" }}
            content={<ChartTooltip valueLabel="new businesses" formatValue={(v) => v} formatLabel={shortDate} />}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--foreground)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
