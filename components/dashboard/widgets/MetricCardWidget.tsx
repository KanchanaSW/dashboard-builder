"use client";

import React from "react";
import WidgetCard from "./WidgetCard";
import type { MetricCardData } from "@/lib/mockData";
import { ArrowUpRightIcon, ArrowDownRightIcon } from "@/components/ui/icons";

interface MetricCardWidgetProps {
  id: string;
  title: string;
  colSpan: number;
  data?: Partial<MetricCardData>;
  showSparkline?: boolean;
  comparisonLabel?: string;
}

export default function MetricCardWidget({
  id,
  title,
  colSpan,
  data,
  showSparkline = true,
  comparisonLabel,
}: MetricCardWidgetProps) {
  const isPositive = data?.deltaPositive ?? true;
  const value = data?.value || "$248,920";
  const delta = data?.delta || "+14.2%";
  const subtext = comparisonLabel || data?.subtext || "vs. last month";

  // Mini sparkline path generator
  const sparklinePoints = data?.sparkline || [12, 16, 14, 19, 23, 22, 28, 31];
  const min = Math.min(...sparklinePoints);
  const max = Math.max(...sparklinePoints);
  const range = max - min || 1;
  const width = 110;
  const height = 36;
  const points = sparklinePoints
    .map((val, idx) => {
      const x = (idx / (sparklinePoints.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <WidgetCard id={id} title={title} colSpan={colSpan}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">
              {value}
            </span>
          </div>

          {/* Delta & Comparison pill */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 ring-rose-500/20",
              ].join(" ")}
            >
              {isPositive ? (
                <ArrowUpRightIcon size={13} className="shrink-0" />
              ) : (
                <ArrowDownRightIcon size={13} className="shrink-0" />
              )}
              {delta}
            </span>

            {subtext && (
              <span className="text-xs text-slate-400 truncate max-w-[200px]">
                {subtext}
              </span>
            )}
          </div>
        </div>

        {/* Sparkline visualization */}
        {showSparkline && (
          <div className="hidden sm:block shrink-0">
            <svg width={width} height={height} className="overflow-visible">
              <defs>
                <linearGradient id={`sparkGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPositive ? "#10b981" : "#f43f5e"}
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stopColor={isPositive ? "#10b981" : "#f43f5e"}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>
              <polygon
                points={`0,${height} ${points} ${width},${height}`}
                fill={`url(#sparkGrad-${id})`}
              />
              <polyline
                points={points}
                fill="none"
                stroke={isPositive ? "#10b981" : "#f43f5e"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
