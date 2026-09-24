"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useDashboard } from "@/lib/dashboardStore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  calculateGridSpanFromPixelDelta,
  getGridCellDimensions,
  getColumnsForDevice,
} from "@/lib/gridMath";
import {
  GripIcon,
  TrashIcon,
  CopyIcon,
  SlidersIcon,
  ResizeGripIcon,
} from "@/components/ui/icons";

interface WidgetCardProps {
  id: string;
  title: string;
  colSpan: number;
  children: React.ReactNode;
  className?: string;
  actionNode?: React.ReactNode;
}

export default function WidgetCard({
  id,
  title,
  colSpan,
  children,
  className = "",
  actionNode,
}: WidgetCardProps) {
  const {
    widgets,
    viewMode,
    deviceMode,
    selectedWidgetId,
    setSelectedWidgetId,
    removeWidget,
    duplicateWidget,
    resizeWidget,
    setIsInspectorOpen,
    moveWidget,
  } = useDashboard();

  const isSelected = selectedWidgetId === id;
  const isEditMode = viewMode === "edit";
  const totalCols = getColumnsForDevice(deviceMode);
  const isResizable = isEditMode && (deviceMode === "desktop" || deviceMode === "tablet");

  const widget = widgets.find((w) => w.id === id);
  const currentSpan = widget?.gridSpan || { cols: colSpan, rows: 2 };
  const gridPos = widget?.gridPosition;

  // Resize local state
  const [isResizing, setIsResizing] = useState(false);
  const [resizingSpan, setResizingSpan] = useState<{ cols: number; rows: number } | null>(null);
  const [activeHandle, setActiveHandle] = useState<"corner" | "right" | "bottom" | null>(null);
  const [cellMetrics, setCellMetrics] = useState<{ colWidth: number; rowHeight: number }>({
    colWidth: 100,
    rowHeight: 100,
  });

  const cardRef = useRef<HTMLDivElement | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "widget",
      id,
    },
    disabled: !isEditMode,
  });

  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      cardRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  useEffect(() => {
    if (!isResizing || !activeHandle) return;

    const cursor =
      activeHandle === "corner"
        ? "se-resize"
        : activeHandle === "right"
        ? "e-resize"
        : "s-resize";
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isResizing, activeHandle]);

  const handleResizeStart = (
    e: React.PointerEvent<HTMLDivElement>,
    handleType: "corner" | "right" | "bottom"
  ) => {
    if (!isResizable) return;
    if (e.button !== 0) return; // Only primary mouse button

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialSpan = { ...currentSpan };
    const startCol = gridPos?.col;

    const cardElement = cardRef.current;
    const cardRect = cardElement?.getBoundingClientRect();
    const gridContainer =
      cardElement?.closest("#dashboard-canvas-grid") ||
      document.getElementById("dashboard-canvas-grid");
    const gridRect = gridContainer?.getBoundingClientRect();

    const { colWidth, rowHeight } = getGridCellDimensions(
      gridRect,
      totalCols,
      cardRect ? cardRect.height / (initialSpan.rows || 1) : 100
    );

    setCellMetrics({ colWidth, rowHeight });
    setIsResizing(true);
    setActiveHandle(handleType);
    setResizingSpan(initialSpan);

    let latestSpan = initialSpan;

    const onPointerMove = (moveEvt: PointerEvent) => {
      moveEvt.preventDefault();
      const rawDx = moveEvt.clientX - startX;
      const rawDy = moveEvt.clientY - startY;

      const pixelDelta = {
        dx: handleType === "bottom" ? 0 : rawDx,
        dy: handleType === "right" ? 0 : rawDy,
      };

      const nextSpan = calculateGridSpanFromPixelDelta(
        initialSpan,
        pixelDelta,
        colWidth,
        rowHeight,
        {
          minCols: 1,
          maxCols: totalCols,
          minRows: 2,
          maxRows: 8,
        },
        startCol,
        totalCols
      );

      latestSpan = nextSpan;
      setResizingSpan(nextSpan);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      setIsResizing(false);
      setActiveHandle(null);
      setResizingSpan(null);
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      upEvt.preventDefault();
      cleanup();

      // Single state update on pointerup (important for undo/redo granularity)
      if (
        latestSpan.cols !== initialSpan.cols ||
        latestSpan.rows !== initialSpan.rows
      ) {
        resizeWidget(id, latestSpan);
      }
    };

    const onPointerCancel = () => {
      cleanup();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea")
    ) {
      return;
    }
    setSelectedWidgetId(id);
    setIsInspectorOpen(true);
  };

  const handleSpanChange = (e: React.MouseEvent, span: number) => {
    e.stopPropagation();
    resizeWidget(id, { cols: span, rows: currentSpan.rows });
  };

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isResizing ? "none" : transition || undefined,
    zIndex: isResizing ? 50 : isDragging ? 40 : undefined,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setCombinedRef}
      style={sortableStyle}
      onClick={handleCardClick}
      className={[
        "group relative flex flex-col rounded-2xl transition-all duration-150 h-full",
        "bg-slate-900/80 backdrop-blur-md border",
        isResizing
          ? "border-indigo-400 ring-2 ring-indigo-500/40 shadow-2xl shadow-indigo-500/20"
          : isSelected && isEditMode
          ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-500/5"
          : "border-slate-800/80 hover:border-slate-700/80 shadow-md hover:shadow-lg",
        isDragging ? "ring-2 ring-indigo-500 border-indigo-500 shadow-2xl" : "",
        isEditMode ? "cursor-pointer" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Active Resize Ghost Preview & Size Badge ── */}
      {isResizing && resizingSpan && (
        <>
          {/* Dashed Ghost Outline extending to candidate size */}
          <div
            className="pointer-events-none absolute -inset-0.5 rounded-2xl border-2 border-dashed border-indigo-400/90 bg-indigo-500/10 z-40 transition-all duration-75 shadow-lg shadow-indigo-500/10"
            style={{
              width: `calc(100% + ${(resizingSpan.cols - currentSpan.cols) * cellMetrics.colWidth}px)`,
              height: `calc(100% + ${(resizingSpan.rows - currentSpan.rows) * cellMetrics.rowHeight}px)`,
            }}
          />

          {/* Floating Size Pill */}
          <div className="pointer-events-none absolute bottom-3 right-3 z-50 flex items-center gap-1.5 rounded-lg bg-indigo-600/95 px-2.5 py-1 text-white font-mono text-[11px] font-bold shadow-xl border border-indigo-400/50 backdrop-blur-md">
            <span>
              {resizingSpan.cols}c × {resizingSpan.rows}r
            </span>
            <span className="text-[9px] font-sans font-normal text-indigo-200">
              ({resizingSpan.cols} cols × {resizingSpan.rows} rows)
            </span>
          </div>
        </>
      )}

      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3.5 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Drag Handle with Keyboard Support */}
          {isEditMode && (
            <div
              {...attributes}
              {...listeners}
              role="button"
              tabIndex={0}
              aria-label={`Drag to reorder ${title}. Press Space or Enter to initiate drag, arrow keys to move, Space or Enter to drop.`}
              className="flex items-center gap-0.5 text-slate-500 hover:text-slate-200 cursor-grab active:cursor-grabbing p-1 -m-1 rounded hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              title="Drag to reorder (or Space + Arrow keys)"
            >
              <GripIcon size={14} />
            </div>
          )}
          <h3 className="truncate text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
            {title}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {actionNode}

          {/* Builder Toolbar - shown in edit mode */}
          {isEditMode && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Width toggle pills */}
              <div className="hidden sm:flex items-center rounded-md bg-slate-800/90 p-0.5 border border-slate-700/60 text-[10px]">
                {(totalCols === 6 ? [2, 3, 4, 6] : [3, 4, 6, 8, 12]).map((span) => (
                  <button
                    key={span}
                    onClick={(e) => handleSpanChange(e, span)}
                    title={`Span ${span} columns`}
                    className={[
                      "px-1.5 py-0.5 rounded font-mono font-medium transition-colors",
                      colSpan === span
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200",
                    ].join(" ")}
                  >
                    {span}c
                  </button>
                ))}
              </div>

              {/* Move up / down */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveWidget(id, "up");
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Move up"
              >
                <span className="text-xs">↑</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveWidget(id, "down");
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Move down"
              >
                <span className="text-xs">↓</span>
              </button>

              {/* Configure / Inspector */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWidgetId(id);
                  setIsInspectorOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                title="Widget settings"
              >
                <SlidersIcon size={13} />
              </button>

              {/* Duplicate */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateWidget(id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Duplicate widget"
              >
                <CopyIcon size={13} />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeWidget(id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete widget"
              >
                <TrashIcon size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Widget Body ── */}
      <div className="flex flex-1 flex-col p-5 overflow-hidden">{children}</div>

      {/* ── Resize Handles (Desktop Edit Mode) ── */}
      {isResizable && !isDragging && (
        <>
          {/* Right Edge Handle */}
          <div
            role="button"
            tabIndex={-1}
            aria-label="Resize widget width"
            onPointerDown={(e) => handleResizeStart(e, "right")}
            className={[
              "absolute top-8 bottom-8 -right-1 w-2.5 z-30",
              "cursor-e-resize select-none touch-none flex items-center justify-center",
              "transition-opacity duration-150",
              isResizing && activeHandle === "right"
                ? "opacity-100"
                : isSelected
                ? "opacity-80 hover:opacity-100"
                : "opacity-0 group-hover:opacity-100",
            ].join(" ")}
            title="Drag to resize width"
          >
            <div
              className={[
                "w-1 rounded-full transition-all duration-150",
                isResizing && activeHandle === "right"
                  ? "bg-indigo-400 h-12 w-1.5 shadow-sm shadow-indigo-400"
                  : "bg-slate-600/70 h-8 hover:bg-indigo-400 hover:h-10",
              ].join(" ")}
            />
          </div>

          {/* Bottom Edge Handle */}
          <div
            role="button"
            tabIndex={-1}
            aria-label="Resize widget height"
            onPointerDown={(e) => handleResizeStart(e, "bottom")}
            className={[
              "absolute -bottom-1 left-8 right-8 h-2.5 z-30",
              "cursor-s-resize select-none touch-none flex items-center justify-center",
              "transition-opacity duration-150",
              isResizing && activeHandle === "bottom"
                ? "opacity-100"
                : isSelected
                ? "opacity-80 hover:opacity-100"
                : "opacity-0 group-hover:opacity-100",
            ].join(" ")}
            title="Drag to resize height"
          >
            <div
              className={[
                "h-1 rounded-full transition-all duration-150",
                isResizing && activeHandle === "bottom"
                  ? "bg-indigo-400 w-12 h-1.5 shadow-sm shadow-indigo-400"
                  : "bg-slate-600/70 w-8 hover:bg-indigo-400 hover:w-10",
              ].join(" ")}
            />
          </div>

          {/* Bottom-Right Corner Handle */}
          <div
            role="button"
            tabIndex={-1}
            aria-label="Resize widget width and height"
            onPointerDown={(e) => handleResizeStart(e, "corner")}
            className={[
              "absolute -bottom-1 -right-1 z-30 flex h-6 w-6 items-center justify-center",
              "cursor-se-resize select-none touch-none rounded-br-2xl rounded-tl-lg",
              "bg-slate-800/95 text-slate-400 hover:text-white hover:bg-indigo-600",
              "border border-slate-700/80 hover:border-indigo-400 shadow-md transition-all duration-150",
              isResizing && activeHandle === "corner"
                ? "bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/50 scale-110 opacity-100"
                : isSelected
                ? "opacity-90 hover:opacity-100"
                : "opacity-0 group-hover:opacity-100",
            ].join(" ")}
            title="Drag to resize width and height"
          >
            <ResizeGripIcon size={12} />
          </div>
        </>
      )}
    </div>
  );
}

