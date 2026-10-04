import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { kgToLbs } from "@/lib/nutrition";

export default function WeightChart({ entries, imperial }) {
  const data = [...entries]
    .sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at))
    .map((e) => ({
      date: new Date(e.logged_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: imperial ? +kgToLbs(e.weight_kg).toFixed(1) : +e.weight_kg.toFixed(1),
    }));

  if (data.length === 0) return null;
  if (data.length === 1) {
    return (
      <div className="text-center text-sm text-[#64748B] py-8">
        Your first weigh-in is logged — come back to see your trend line.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 2", "dataMax + 2"]}
          />
          <Tooltip formatter={(v) => [`${v} ${imperial ? "lbs" : "kg"}`, "Weight"]} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#10B981"
            strokeWidth={3}
            dot={{ r: 4, fill: "#10B981" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
