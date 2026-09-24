"use client";

import React from "react";
import WidgetCard from "./WidgetCard";
import type { PlanRevenue } from "@/lib/mockData";

interface BarListCardWidgetProps {
  id: string;
  title: string;
  colSpan: number;
  data: PlanRevenue[];
}

export default function BarListCardWidget({
  id,
  title,
  colSpan,
  data,
}: BarListCardWidgetProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <WidgetCard id={id} title={title} colSpan={colSpan}>
      <div className="space-y-4">
        {data.map((item, idx) => {
          const percent = (item.value / maxVal) * 100;
          return (
            <div key={item.name} className="group/item">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-200">{item.name}</span>
                <div className="flex items-center gap-2 font-mono">
                  {item.amount && (
                    <span className="text-slate-300 font-semibold">{item.amount}</span>
                  )}
                  <span className="text-slate-400">({item.value}%)</span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
                <div
                  className={[
                    "h-full rounded-full transition-all duration-500",
                    idx === 0
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-400"
                      : idx === 1
                      ? "bg-gradient-to-r from-cyan-500 to-cyan-400"
                      : idx === 2
                      ? "bg-gradient-to-r from-violet-500 to-violet-400"
                      : "bg-slate-500",
                  ].join(" ")}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {item.change && (
                <div className="mt-1 flex justify-end">
                  <span
                    className={[
                      "text-[10px] font-medium font-mono",
                      item.change.startsWith("+")
                        ? "text-emerald-400"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {item.change} MoM
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span>Enterprise Share</span>
        <span className="font-semibold text-indigo-400 font-mono">52.0%</span>
      </div>
    </WidgetCard>
  );
}
