"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const shortDate = (label) =>
  new Date(`${label}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function SignupsChart({ points }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="New business signups per day, last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#78716c" }}
            minTickGap={28}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fontSize: 12, fill: "#78716c" }}
          />
          <Tooltip
            formatter={(value) => [value, "New businesses"]}
            labelFormatter={shortDate}
            contentStyle={{ borderRadius: 12, borderColor: "#e7e5e4", fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#d97706"
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
