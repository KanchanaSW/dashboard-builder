"use client";

import React, { useState } from "react";
import { AreaChart, BarChart, LineChart } from "@tremor/react";
import WidgetCard from "./WidgetCard";
import type { RevenueChartRow } from "@/lib/mockData";
import { useDashboard } from "@/lib/dashboardStore";

interface ChartCardWidgetProps {
  id: string;
  title: string;
  colSpan: number;
  data: RevenueChartRow[];
  chartType?: "area" | "bar" | "line";
  timeRange?: "7D" | "30D" | "90D" | "1Y";
}

const valueFormatter = (n: number) =>
  "$" + Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

export default function ChartCardWidget({
  id,
  title,
  colSpan,
  data,
  chartType = "area",
}: ChartCardWidgetProps) {
  const { updateWidget } = useDashboard();
  const [activeType, setActiveType] = useState<"area" | "bar" | "line">(chartType);
  const [activeRange, setActiveRange] = useState<"3M" | "6M" | "1Y">("1Y");

  // Filter data based on range
  const filteredData =
    activeRange === "3M"
      ? data.slice(-3)
      : activeRange === "6M"
      ? data.slice(-6)
      : data;

  const handleTypeChange = (type: "area" | "bar" | "line") => {
    setActiveType(type);
    updateWidget(id, { config: { chartType: type } });
  };

  const chartCategories = ["2026", "2025"];
  const chartColors = ["indigo", "cyan"];

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      index: "month",
      categories: chartCategories,
      colors: chartColors,
      valueFormatter: valueFormatter,
      showLegend: true,
      showGridLines: true,
      className: "h-64 mt-4",
    };

    if (activeType === "bar") {
      return <BarChart {...commonProps} />;
    }
    if (activeType === "line") {
      return <LineChart {...commonProps} />;
    }
    return <AreaChart {...commonProps} />;
  };

  return (
    <WidgetCard
      id={id}
      title={title}
      colSpan={colSpan}
      actionNode={
        <div className="flex items-center gap-2">
          {/* Chart Type Selector */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-xs">
            {(["area", "bar", "line"] as const).map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeChange(t);
                }}
                className={[
                  "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize transition-all",
                  activeType === t
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Time range selector */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-xs">
            {(["3M", "6M", "1Y"] as const).map((r) => (
              <button
                key={r}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveRange(r);
                }}
                className={[
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition-all",
                  activeRange === r
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Top summary stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold font-mono text-white">$4.91M</span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
            +18.4% YoY
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-indigo-500" />
            <span>2026 Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cyan-400" />
            <span>2025 Baseline</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full">{renderChart()}</div>
    </WidgetCard>
  );
}
