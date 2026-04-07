"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type DataPoint = { name: string; value: number; color: string };

export default function PlanDistributionChart({ data }: { data: DataPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#1e3f52", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)" }}>
              {d.name}
            </span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "white", marginLeft: "auto" }}>
              {d.value}
            </span>
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)" }}>
              ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
