"use client";

import React, { useMemo } from "react";
import { useDashboard } from "@/lib/dashboardStore";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import WidgetRenderer from "./widgets/WidgetRenderer";
import {
  getColumnsForDevice,
} from "@/lib/gridMath";
import {
  SparklesIcon,
  PlusIcon,
  LayoutGridIcon,
} from "@/components/ui/icons";

/**
 * Droppable grid cell on the canvas
 */
function GridDroppableCell({
  col,
  row,
  isEditMode,
}: {
  col: number;
  row: number;
  isEditMode: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${col}-${row}`,
    data: {
      type: "grid-cell",
      col,
      row,
    },
    disabled: !isEditMode,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: `${col} / span 1`,
        gridRow: `${row} / span 1`,
      }}
      className={[
        "min-h-[80px] rounded-xl transition-all duration-150 pointer-events-auto border",
        isOver
          ? "border-indigo-400/90 bg-indigo-500/20 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10 scale-[1.01] z-10"
          : isEditMode
          ? "border-dashed border-slate-800/40 bg-slate-900/10 hover:border-slate-700/60"
          : "border-transparent",
      ].join(" ")}
    />
  );
}

export default function DashboardCanvas() {
  const {
    widgets,
    deviceMode,
    viewMode,
    addWidget,
    dateRange,
    dashboardTitle,
    selectedWidgetId,
  } = useDashboard();

  const isEditMode = viewMode === "edit";
  const columns = getColumnsForDevice(deviceMode);

  // Canvas droppable wrapper
  const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({
    id: "canvas-droppable",
    data: {
      type: "canvas",
    },
  });

  // Calculate grid row bounds based on placed widgets
  const totalRows = useMemo(() => {
    const highestRow = widgets.reduce(
      (max, w) => Math.max(max, w.gridPosition.row + w.gridSpan.rows - 1),
      4
    );
    return Math.max(highestRow + 2, 7);
  }, [widgets]);

  // Determine container width based on device viewport mode
  const getContainerWidth = () => {
    switch (deviceMode) {
      case "mobile":
        return "max-w-[440px] shadow-2xl ring-1 ring-slate-800 rounded-2xl";
      case "tablet":
        return "max-w-[880px] shadow-2xl ring-1 ring-slate-800 rounded-2xl";
      case "desktop":
      default:
        return "w-full max-w-[1700px]";
    }
  };

  // Generate cells for droppable grid matching current device columns
  const gridCells = useMemo(() => {
    if (!isEditMode) return [];
    const cells = [];
    for (let r = 1; r <= totalRows; r++) {
      for (let c = 1; c <= columns; c++) {
        cells.push({ col: c, row: r });
      }
    }
    return cells;
  }, [totalRows, isEditMode, columns]);

  return (
    <main className="flex-1 overflow-y-auto canvas-grid-pattern p-6 transition-all duration-300 flex flex-col items-center">
      <div className={`w-full transition-all duration-300 ${getContainerWidth()}`}>
        {/* ── Top Executive Banner & Insights Bar ── */}
        <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/20 shrink-0">
                <SparklesIcon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    {dashboardTitle}
                  </h1>
                  <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    {dateRange} Window
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Consolidated performance metrics, subscription trends, and active revenue
                  pacing across all enterprise clusters.
                </p>
              </div>
            </div>

            {/* Quick action in edit mode */}
            {isEditMode && (
              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => addWidget("number")}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                >
                  <PlusIcon size={13} />
                  <span>Add Metric</span>
                </button>
                <button
                  onClick={() => addWidget("line")}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/20"
                >
                  <PlusIcon size={13} />
                  <span>Add Chart</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Canvas Grid Container ── */}
        <div
          ref={setCanvasRef}
          id="dashboard-canvas-grid"
          className={[
            "relative grid gap-4 transition-colors min-h-[480px] p-2 rounded-2xl",
            isCanvasOver ? "ring-1 ring-indigo-500/30" : "",
          ].join(" ")}
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: "minmax(90px, auto)",
          }}
        >
          {/* Base Layer: Droppable Grid Cells (visible in edit mode) */}
          {gridCells.map((cell) => (
            <GridDroppableCell
              key={`cell-${cell.col}-${cell.row}`}
              col={cell.col}
              row={cell.row}
              isEditMode={isEditMode}
            />
          ))}

          {/* Top Layer: Placed Sortable Widgets */}
          <SortableContext
            items={widgets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            {widgets.map((widget) => {
              const colStart = Math.max(1, Math.min(columns, widget.gridPosition?.col || 1));
              const colSpan = Math.max(1, Math.min(columns - colStart + 1, widget.gridSpan?.cols || 1));
              const rowStart = Math.max(1, widget.gridPosition?.row || 1);
              const rowSpan = Math.max(1, widget.gridSpan?.rows || 2);

              const style: React.CSSProperties = {
                gridColumn: `${colStart} / span ${colSpan}`,
                gridRow: `${rowStart} / span ${rowSpan}`,
                zIndex: selectedWidgetId === widget.id ? 30 : 20,
              };

              return (
                <div
                  key={widget.id}
                  style={style}
                  className="relative transition-all duration-150 h-full"
                >
                  <WidgetRenderer widget={widget} />
                </div>
              );
            })}
          </SortableContext>
        </div>

        {/* Empty state if user deletes all widgets */}
        {widgets.length === 0 && (
          <div className="my-16 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 p-12 text-center bg-slate-900/30 backdrop-blur-sm">
            <div className="rounded-2xl bg-slate-800/80 p-4 text-slate-400 border border-slate-700/60 mb-4">
              <LayoutGridIcon size={32} />
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              Canvas is empty
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Drag widgets from the left library or use the quick buttons below to
              begin building your executive dashboard.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => addWidget("number")}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md"
              >
                + Add Metric KPI
              </button>
              <button
                onClick={() => addWidget("line")}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-750 transition-colors"
              >
                + Add Revenue Chart
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
