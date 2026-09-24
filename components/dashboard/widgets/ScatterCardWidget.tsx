"use client";

import React from "react";
import WidgetCard from "./WidgetCard";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
} from "recharts";

interface ScatterCardWidgetProps {
  id: string;
  title: string;
  colSpan: number;
}

const mockScatterData = [
  { dealSize: 12, salesCycle: 14, efficiency: 88, cluster: "FinTech" },
  { dealSize: 28, salesCycle: 22, efficiency: 94, cluster: "AI/ML" },
  { dealSize: 45, salesCycle: 35, efficiency: 76, cluster: "Enterprise" },
  { dealSize: 18, salesCycle: 18, efficiency: 82, cluster: "HealthTech" },
  { dealSize: 32, salesCycle: 29, efficiency: 91, cluster: "DevTools" },
  { dealSize: 64, salesCycle: 42, efficiency: 85, cluster: "Enterprise" },
  { dealSize: 22, salesCycle: 20, efficiency: 90, cluster: "Retail" },
  { dealSize: 55, salesCycle: 38, efficiency: 79, cluster: "SaaS" },
  { dealSize: 15, salesCycle: 16, efficiency: 86, cluster: "Security" },
  { dealSize: 38, salesCycle: 31, efficiency: 92, cluster: "FinTech" },
];

const clusterColors: Record<string, string> = {
  FinTech: "#6366f1",
  "AI/ML": "#06b6d4",
  Enterprise: "#8b5cf6",
  HealthTech: "#10b981",
  DevTools: "#f59e0b",
  Retail: "#ec4899",
  SaaS: "#3b82f6",
  Security: "#14b8a6",
};

export default function ScatterCardWidget({
  id,
  title,
  colSpan,
}: ScatterCardWidgetProps) {
  return (
    <WidgetCard id={id} title={title} colSpan={colSpan}>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>Deal Velocity vs. ACV ($k)</span>
        <span className="font-mono text-cyan-400 text-[11px]">Correlation: +0.78</span>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
            <XAxis
              type="number"
              dataKey="salesCycle"
              name="Cycle (Days)"
              unit="d"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="dealSize"
              name="ACV"
              unit="k"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
            />
            <ZAxis type="number" dataKey="efficiency" range={[60, 220]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2 shadow-xl text-xs text-slate-200">
                      <div className="font-semibold text-white">{data.cluster}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Cycle: {data.salesCycle}d | ACV: ${data.dealSize}k
                      </div>
                      <div className="text-indigo-400 text-[10px] mt-0.5">
                        Efficiency Score: {data.efficiency}%
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={mockScatterData}>
              {mockScatterData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={clusterColors[entry.cluster] || "#6366f1"}
                  fillOpacity={0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>X: Cycle length</span>
        <span>Y: Contract ACV</span>
        <span>Radius: Efficiency</span>
      </div>
    </WidgetCard>
  );
}

