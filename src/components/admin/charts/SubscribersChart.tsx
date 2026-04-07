"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type DataPoint = { month: string; count: number };

export default function SubscribersChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f5a623" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f5a623" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e3f52", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
          labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          itemStyle={{ color: "#f5a623" }}
        />
        <Area type="monotone" dataKey="count" stroke="#f5a623" strokeWidth={2} fill="url(#subGradient)" name="Abonnés" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
