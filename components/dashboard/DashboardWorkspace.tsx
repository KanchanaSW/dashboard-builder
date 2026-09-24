"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useDashboard } from "@/lib/dashboardStore";
import {
  handleCollisionRule,
  swapWidgetPositions,
  calculateGridPositionFromPixels,
  findNearestFreeCell,
  getColumnsForDevice,
  type WidgetInstance,
  type WidgetType,
} from "@/lib/gridMath";
import WidgetPalette from "./WidgetPalette";
import DashboardCanvas from "./DashboardCanvas";
import WidgetInspector from "./WidgetInspector";
import WidgetRenderer from "./widgets/WidgetRenderer";
import { GripIcon, EditIcon } from "@/components/ui/icons";

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

export default function DashboardWorkspace() {
  const {
    widgets,
    setWidgets,
    setSelectedWidgetId,
    setIsInspectorOpen,
    viewMode,
    setViewMode,
    deviceMode,
    isPaletteOpen,
    isInspectorOpen,
    isReadOnlyView,
  } = useDashboard();

  const isEditMode = viewMode === "edit";
  const totalCols = getColumnsForDevice(deviceMode);

  // Active drag states
  const [activePaletteItem, setActivePaletteItem] = useState<{
    type: WidgetType;
    label: string;
    defaultCols: number;
    defaultRows: number;
  } | null>(null);

  const [activePlacedWidget, setActivePlacedWidget] = useState<WidgetInstance | null>(
    null
  );

  // Configure sensors: PointerSensor with threshold prevents accidental drag on click,
  // and KeyboardSensor enables full keyboard accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!isEditMode) return;
    const { active } = event;
    const data = active.data.current;

    if (data?.isPaletteItem) {
      setActivePaletteItem({
        type: data.type,
        label: data.label,
        defaultCols: data.defaultCols,
        defaultRows: data.defaultRows,
      });
      setActivePlacedWidget(null);
    } else {
      const widget = widgets.find((w) => w.id === active.id);
      if (widget) {
        setActivePlacedWidget(widget);
      }
      setActivePaletteItem(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset overlay state
    setActivePaletteItem(null);
    setActivePlacedWidget(null);

    if (!over || !isEditMode) return;

    const isFromPalette = Boolean(active.data.current?.isPaletteItem);
    const canvasEl = document.getElementById("dashboard-canvas-grid");
    const canvasRect = canvasEl ? canvasEl.getBoundingClientRect() : null;

    // Determine target grid position from drop target
    let targetPos: { col: number; row: number } | null = null;

    // 1. Direct drop onto a specific droppable grid cell
    if (over.data.current?.type === "grid-cell") {
      targetPos = {
        col: over.data.current.col,
        row: over.data.current.row,
      };
    }
    // 2. Direct drop onto an existing placed widget
    else if (over.data.current?.type === "widget" || widgets.some((w) => w.id === over.id)) {
      const overWidget = widgets.find((w) => w.id === over.id);
      if (overWidget) {
        targetPos = { ...overWidget.gridPosition };
      }
    }
    // 3. Drop onto the canvas wrapper or background using position math
    else if (
      (over.id === "canvas-droppable" || over.data.current?.type === "canvas") &&
      canvasRect &&
      active.rect.current.translated
    ) {
      targetPos = calculateGridPositionFromPixels(
        active.rect.current.translated.left,
        active.rect.current.translated.top,
        canvasRect,
        totalCols
      );
    }

    // 4. Fallback: compute nearest free grid cell
    if (!targetPos) {
      const defaultSpanCols = active.data.current?.defaultCols || 4;
      const spanCols =
        totalCols === 6
          ? Math.max(1, Math.min(6, Math.round(defaultSpanCols / 2)))
          : defaultSpanCols;

      const span = isFromPalette
        ? {
            cols: spanCols,
            rows: active.data.current?.defaultRows || 2,
          }
        : activePlacedWidget?.gridSpan || { cols: Math.min(totalCols, 4), rows: 2 };
      targetPos = findNearestFreeCell(widgets, span, { col: 1, row: 1 }, undefined, totalCols);
    }

    // Execute placement logic
    if (isFromPalette) {
      // Create new widget instance
      const newType = active.data.current?.type as WidgetType;
      const rawCols = active.data.current?.defaultCols || 4;
      const newCols =
        totalCols === 6
          ? Math.max(1, Math.min(6, Math.round(rawCols / 2)))
          : Math.min(totalCols, rawCols);
      const newRows = active.data.current?.defaultRows || 2;
      const newId = `widget-${Date.now()}`;

      const newWidget: WidgetInstance = {
        id: newId,
        type: newType,
        gridPosition: targetPos,
        gridSpan: { cols: newCols, rows: newRows },
        desktopSpan: { cols: rawCols, rows: newRows },
        config: {
          title: active.data.current?.label || "New Widget",
        },
      };

      // Apply MVP collision swap rule with current grid column width
      const updatedWidgets = handleCollisionRule(widgets, newWidget, targetPos, totalCols);
      setWidgets(updatedWidgets);
      setSelectedWidgetId(newId);
      setIsInspectorOpen(true);
    } else {
      // Reordering or moving an existing widget
      const activeWidget = widgets.find((w) => w.id === active.id);
      if (!activeWidget) return;

      // If dropped onto another widget directly, swap their positions
      if (over.id !== active.id && widgets.some((w) => w.id === over.id)) {
        const updatedWidgets = swapWidgetPositions(
          widgets,
          active.id as string,
          over.id as string,
          totalCols
        );
        setWidgets(updatedWidgets);
      } else {
        // Dropped onto an empty cell or canvas area
        const updatedWidgets = handleCollisionRule(widgets, activeWidget, targetPos, totalCols);
        setWidgets(updatedWidgets);
      }
    }
  };

  const handleDragCancel = () => {
    setActivePaletteItem(null);
    setActivePlacedWidget(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-1 overflow-hidden relative">
        {/* In read-only preview mode, palette and inspector are hidden */}
        {isEditMode && isPaletteOpen && <WidgetPalette />}
        <DashboardCanvas />
        {isEditMode && isInspectorOpen && <WidgetInspector />}
      </div>

      {/* Floating Exit Preview control for the builder workspace */}
      {!isEditMode && !isReadOnlyView && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 animate-in fade-in duration-200">
          <button
            onClick={() => setViewMode("edit")}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/50 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-2xl shadow-indigo-500/20 backdrop-blur-xl hover:bg-slate-800 hover:border-indigo-400 transition-all ring-1 ring-white/10"
            title="Return to Dashboard Editor"
          >
            <EditIcon size={14} className="text-indigo-400" />
            <span>Exit Preview</span>
          </button>
        </div>
      )}

      {/* Floating Drag Overlay (only active during edit mode) */}
      {isEditMode && (
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activePaletteItem ? (
            <div className="w-64 rounded-xl border border-indigo-500 bg-slate-900/95 p-3.5 shadow-2xl shadow-indigo-500/30 text-white flex items-center gap-3 backdrop-blur-xl">
              <div className="rounded-lg bg-indigo-500/20 p-2 text-indigo-400 border border-indigo-500/30">
                <GripIcon size={16} />
              </div>
              <div>
                <span className="text-xs font-semibold block text-slate-200">
                  {activePaletteItem.label}
                </span>
                <span className="text-[10px] font-mono text-indigo-300">
                  {activePaletteItem.defaultCols}×{activePaletteItem.defaultRows} columns
                </span>
              </div>
            </div>
          ) : activePlacedWidget ? (
            <div className="w-80 rounded-2xl border-2 border-indigo-500 bg-slate-900/95 p-4 shadow-2xl shadow-indigo-500/40 text-white backdrop-blur-xl pointer-events-none">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {activePlacedWidget.config?.title || "Moving Widget"}
                </span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                  {activePlacedWidget.gridSpan.cols}c
                </span>
              </div>
              <div className="opacity-70 scale-95 pointer-events-none">
                <WidgetRenderer widget={activePlacedWidget} />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      )}
    </DndContext>
  );
}

