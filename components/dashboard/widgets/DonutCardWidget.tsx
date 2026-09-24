"use client";

import React from "react";
import { DonutChart } from "@tremor/react";
import WidgetCard from "./WidgetCard";
import type { ChannelShare } from "@/lib/mockData";

interface DonutCardWidgetProps {
  id: string;
  title: string;
  colSpan: number;
  data: ChannelShare[];
}

const valueFormatter = (number: number) => `${number}%`;

export default function DonutCardWidget({
  id,
  title,
  colSpan,
  data,
}: DonutCardWidgetProps) {
  const colors = ["indigo", "cyan", "violet", "amber"];

  return (
    <WidgetCard id={id} title={title} colSpan={colSpan}>
      <div className="flex flex-col items-center justify-center">
        <DonutChart
          data={data}
          category="value"
          index="name"
          valueFormatter={valueFormatter}
          colors={colors}
          className="h-44"
        />

        {/* Custom Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 w-full pt-3 border-t border-slate-800/60">
          {data.map((item, idx) => {
            const dotColors = [
              "bg-indigo-500",
              "bg-cyan-400",
              "bg-violet-500",
              "bg-amber-400",
            ];
            return (
              <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`size-2 shrink-0 rounded-full ${dotColors[idx % dotColors.length]}`} />
                  <span className="truncate text-slate-300">{item.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-200 ml-2">
                  {item.formatted}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetCard>
  );
}

