"use client";

import React from "react";
import { useDashboard } from "@/lib/dashboardStore";
import {
  SlidersIcon,
  TrashIcon,
  CopyIcon,
  ChartAreaIcon,
  ChartBarIcon,
  TableIcon,
  HashIcon,
  SparklesIcon,
} from "@/components/ui/icons";

export default function WidgetInspector() {
  const {
    widgets,
    selectedWidgetId,
    updateWidget,
    resizeWidget,
    removeWidget,
    duplicateWidget,
    isInspectorOpen,
    setIsInspectorOpen,
  } = useDashboard();

  if (!isInspectorOpen || !selectedWidgetId) {
    return null;
  }

  const widget = widgets.find((w) => w.id === selectedWidgetId);
  if (!widget) return null;

  const currentCols = widget.gridSpan.cols;
  const currentRows = widget.gridSpan.rows;
  const title = (widget.config?.title as string) || "";
  const comparisonLabel = (widget.config?.comparisonLabel as string) || "";
  const value = (widget.config?.value as string) || "";
  const delta = (widget.config?.delta as string) || "";
  const textContent = (widget.config?.content as string) || "";

  const handleSpanChange = (cols: number) => {
    resizeWidget(widget.id, { cols, rows: widget.gridSpan.rows });
  };

  const handleRowsChange = (rows: number) => {
    resizeWidget(widget.id, { cols: widget.gridSpan.cols, rows });
  };

  return (
    <aside className="w-80 shrink-0 border-l border-slate-800/80 bg-slate-900/95 backdrop-blur-xl flex flex-col h-full shadow-2xl z-20 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <SlidersIcon size={16} className="text-indigo-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Widget Inspector
          </h2>
        </div>
        <button
          onClick={() => setIsInspectorOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Close Inspector"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Type & Coordinate Badge */}
        <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
          <div className="flex items-center gap-2">
            {(widget.type === "number" || widget.type === "sparkline") && (
              <HashIcon size={16} className="text-cyan-400" />
            )}
            {widget.type === "line" && <ChartAreaIcon size={16} className="text-indigo-400" />}
            {widget.type === "bar" && <ChartBarIcon size={16} className="text-cyan-400" />}
            {widget.type === "scatter" && <SparklesIcon size={16} className="text-violet-400" />}
            {widget.type === "barList" && <ChartBarIcon size={16} className="text-emerald-400" />}
            {widget.type === "table" && <TableIcon size={16} className="text-amber-400" />}
            {widget.type === "text" && <HashIcon size={16} className="text-pink-400" />}
            <span className="font-semibold capitalize text-slate-200">
              {widget.type} Widget
            </span>
          </div>
          <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
            Pos: c{widget.gridPosition.col} r{widget.gridPosition.row}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-medium">Widget Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...widget.config, title: e.target.value },
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Column Width Span */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-medium">Width (Columns)</span>
            <span className="font-mono text-indigo-400">{currentCols} / 12</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[3, 4, 6, 8, 12].map((span) => (
              <button
                key={span}
                onClick={() => handleSpanChange(span)}
                className={[
                  "rounded-lg border py-1.5 font-mono font-medium transition-all text-center",
                  currentCols === span
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-xs"
                    : "border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600",
                ].join(" ")}
              >
                {span}c
              </button>
            ))}
          </div>
        </div>

        {/* Row Height Span */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-medium">Height (Rows)</span>
            <span className="font-mono text-indigo-400">{currentRows} rows</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[2, 3, 4, 5].map((rows) => (
              <button
                key={rows}
                onClick={() => handleRowsChange(rows)}
                className={[
                  "rounded-lg border py-1.5 font-mono font-medium transition-all text-center",
                  currentRows === rows
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-xs"
                    : "border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600",
                ].join(" ")}
              >
                {rows}r
              </button>
            ))}
          </div>
        </div>

        {/* Metric / Sparkline Configurations */}
        {(widget.type === "number" || widget.type === "sparkline") && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              KPI Metrics
            </h4>

            <div className="space-y-1.5">
              <label className="text-slate-400">Primary Value</label>
              <input
                type="text"
                value={value}
                placeholder="$248,920"
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...widget.config, value: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400">Delta / Variance</label>
              <input
                type="text"
                value={delta}
                placeholder="+14.2%"
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...widget.config, delta: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400">Comparison Label</label>
              <input
                type="text"
                value={comparisonLabel}
                placeholder="vs. last month"
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...widget.config, comparisonLabel: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Text Widget Configurations */}
        {widget.type === "text" && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Note Commentary
            </h4>
            <div className="space-y-1.5">
              <label className="text-slate-400">Markdown / Content</label>
              <textarea
                rows={4}
                value={textContent}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...widget.config, content: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none text-xs leading-relaxed resize-none"
              />
            </div>
          </div>
        )}

        {/* Actions (Duplicate & Delete) */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => duplicateWidget(widget.id)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <CopyIcon size={14} />
            <span>Duplicate Widget</span>
          </button>

          <button
            onClick={() => removeWidget(widget.id)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <TrashIcon size={14} />
            <span>Remove from Canvas</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
