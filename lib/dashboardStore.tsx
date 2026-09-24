"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
} from "react";
import { create, useStore } from "zustand";
import { temporal } from "zundo";
import {
  type WidgetType,
  type WidgetInstance,
  type DeviceMode,
  findNearestFreeCell,
  handleCollisionRule,
  swapWidgetPositions,
  reflowWidgetsForColumns,
  getColumnsForDevice,
} from "./gridMath";

export type { WidgetType, WidgetInstance, DeviceMode };
export type GridPosition = { col: number; row: number };
export type GridSpan = { cols: number; rows: number };
export type ViewMode = "edit" | "preview";

export const INITIAL_WIDGETS: WidgetInstance[] = [
  {
    id: "widget-mrr",
    type: "number",
    gridPosition: { col: 1, row: 1 },
    gridSpan: { cols: 4, rows: 2 },
    config: {
      title: "Monthly Recurring Revenue",
      dataKey: "mrr",
      comparisonLabel: "vs. Aug (+12.4%)",
      value: "$482,190",
      delta: "+12.4%",
      deltaPositive: true,
    },
  },
  {
    id: "widget-users",
    type: "sparkline",
    gridPosition: { col: 5, row: 1 },
    gridSpan: { cols: 4, rows: 2 },
    config: {
      title: "Active Organizations",
      dataKey: "activeUsers",
      comparisonLabel: "vs. last month (+8.6%)",
      value: "18,204",
      delta: "+8.6%",
      deltaPositive: true,
    },
  },
  {
    id: "widget-churn",
    type: "number",
    gridPosition: { col: 9, row: 1 },
    gridSpan: { cols: 4, rows: 2 },
    config: {
      title: "Net Revenue Churn",
      dataKey: "churnRate",
      comparisonLabel: "Industry baseline: 3.5%",
      value: "1.8%",
      delta: "-0.6 pts",
      deltaPositive: true,
    },
  },
  {
    id: "widget-revenue-chart",
    type: "line",
    gridPosition: { col: 1, row: 3 },
    gridSpan: { cols: 8, rows: 3 },
    config: {
      title: "Net Revenue & Historical Growth",
      dataKey: "revenueTrend",
    },
  },
  {
    id: "widget-plan-breakdown",
    type: "barList",
    gridPosition: { col: 9, row: 3 },
    gridSpan: { cols: 4, rows: 3 },
    config: {
      title: "Revenue by Plan Tier",
      dataKey: "planBreakdown",
    },
  },
  {
    id: "widget-scatter-deals",
    type: "scatter",
    gridPosition: { col: 1, row: 6 },
    gridSpan: { cols: 4, rows: 3 },
    config: {
      title: "Deal Velocity vs. ACV",
      dataKey: "dealVelocity",
    },
  },
  {
    id: "widget-invoices",
    type: "table",
    gridPosition: { col: 5, row: 6 },
    gridSpan: { cols: 8, rows: 3 },
    config: {
      title: "Recent Enterprise Settlements",
      dataKey: "invoices",
    },
  },
];

export function createWidget(
  type: WidgetType,
  position: GridPosition = { col: 1, row: 1 },
  customProps?: Partial<WidgetInstance>
): WidgetInstance {
  const id = `widget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const defaultCols =
    customProps?.gridSpan?.cols ||
    (type === "line" || type === "table" || type === "bar" ? 8 : 4);
  const defaultRows =
    customProps?.gridSpan?.rows ||
    (type === "number" || type === "sparkline" || type === "text" ? 2 : 3);
  const span = { cols: defaultCols, rows: defaultRows };

  let title = "Widget";
  let config: Record<string, unknown> = {};

  switch (type) {
    case "number":
      title = "Executive KPI Metric";
      config = {
        title,
        dataKey: "mrr",
        comparisonLabel: "vs. target (+10%)",
        value: "$124,500",
        delta: "+10.2%",
        deltaPositive: true,
      };
      break;
    case "sparkline":
      title = "Trendline Metric";
      config = {
        title,
        dataKey: "activeUsers",
        comparisonLabel: "vs. last month (+5.4%)",
        value: "9,420",
        delta: "+5.4%",
        deltaPositive: true,
      };
      break;
    case "bar":
      title = "Performance Distribution";
      config = {
        title,
        dataKey: "dealVelocity",
      };
      break;
    case "line":
      title = "Revenue Trajectory";
      config = {
        title,
        dataKey: "revenueTrend",
      };
      break;
    case "scatter":
      title = "Cluster Distribution";
      config = {
        title,
        dataKey: "dealVelocity",
      };
      break;
    case "barList":
      title = "Revenue by Tier";
      config = {
        title,
        dataKey: "planBreakdown",
      };
      break;
    case "table":
      title = "Transaction Records";
      config = {
        title,
        dataKey: "invoices",
      };
      break;
    case "text":
      title = "Executive Briefing";
      config = {
        title,
        content: "Add executive summary commentary, quarter-end forecasts, and strategic observations here.",
      };
      break;
  }

  return {
    id,
    type,
    gridPosition: position,
    gridSpan: span,
    config: {
      ...config,
      ...customProps?.config,
    },
    ...customProps,
  };
}

export interface DashboardStore {
  widgets: WidgetInstance[];
  addWidget: (
    type: WidgetType,
    position?: GridPosition | Partial<WidgetInstance>,
    customProps?: Partial<WidgetInstance>
  ) => void;
  moveWidget: (id: string, position: GridPosition | "up" | "down") => void;
  resizeWidget: (id: string, span: GridSpan) => void;
  removeWidget: (id: string) => void;
  setWidgets: (widgets: WidgetInstance[]) => void;
  updateWidget: (id: string, updates: Partial<WidgetInstance>) => void;
  duplicateWidget: (id: string) => void;
  swapWidgets: (activeId: string, overId: string) => void;
  handleDropWidget: (
    dropped: WidgetInstance,
    targetPosition: GridPosition
  ) => void;
  resetLayout: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  temporal(
    (set) => ({
      widgets: INITIAL_WIDGETS,
      addWidget: (type, positionOrProps, customProps) =>
        set((s) => {
          let pos: GridPosition;
          let props: Partial<WidgetInstance> | undefined;

          if (
            positionOrProps &&
            "col" in positionOrProps &&
            "row" in positionOrProps &&
            typeof positionOrProps.col === "number" &&
            typeof positionOrProps.row === "number"
          ) {
            pos = positionOrProps as GridPosition;
            props = customProps;
          } else {
            props = (positionOrProps as Partial<WidgetInstance>) || customProps;
            const span = props?.gridSpan || { cols: 4, rows: 2 };
            pos = findNearestFreeCell(s.widgets, span, { col: 1, row: 1 });
          }

          return {
            widgets: [...s.widgets, createWidget(type, pos, props)],
          };
        }),
      moveWidget: (id, position) =>
        set((s) => {
          if (typeof position === "string") {
            const index = s.widgets.findIndex((w) => w.id === id);
            if (index === -1) return s;
            if (position === "up" && index === 0) return s;
            if (position === "down" && index === s.widgets.length - 1) return s;
            const targetIndex = position === "up" ? index - 1 : index + 1;
            const otherId = s.widgets[targetIndex].id;
            return { widgets: swapWidgetPositions(s.widgets, id, otherId) };
          }
          return {
            widgets: s.widgets.map((w) =>
              w.id === id ? { ...w, gridPosition: position } : w
            ),
          };
        }),
      resizeWidget: (id, span) =>
        set((s) => ({
          widgets: s.widgets.map((w) =>
            w.id === id
              ? {
                  ...w,
                  gridSpan: span,
                  desktopSpan: span,
                }
              : w
          ),
        })),
      removeWidget: (id) =>
        set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) })),
      setWidgets: (widgets) => set({ widgets }),
      updateWidget: (id, updates) =>
        set((s) => ({
          widgets: s.widgets.map((w) => {
            if (w.id !== id) return w;
            return {
              ...w,
              ...updates,
              config: {
                ...w.config,
                ...updates.config,
              },
              gridPosition: updates.gridPosition || w.gridPosition,
              gridSpan: updates.gridSpan || w.gridSpan,
            };
          }),
        })),
      duplicateWidget: (id) =>
        set((s) => {
          const target = s.widgets.find((w) => w.id === id);
          if (!target) return s;
          const newId = `widget-${Date.now()}`;
          const freeCell = findNearestFreeCell(
            s.widgets,
            target.gridSpan,
            { col: target.gridPosition.col, row: target.gridPosition.row + target.gridSpan.rows }
          );
          const clone: WidgetInstance = {
            ...target,
            id: newId,
            gridPosition: freeCell,
            config: {
              ...target.config,
              title: `${target.config?.title || "Widget"} (Copy)`,
            },
          };
          return { widgets: [...s.widgets, clone] };
        }),
      swapWidgets: (activeId, overId) =>
        set((s) => ({
          widgets: swapWidgetPositions(s.widgets, activeId, overId),
        })),
      handleDropWidget: (dropped, targetPosition) =>
        set((s) => ({
          widgets: handleCollisionRule(s.widgets, dropped, targetPosition),
        })),
      resetLayout: () => set({ widgets: INITIAL_WIDGETS }),
    }),
    { limit: 50 }
  )
);

interface DashboardUIState {
  selectedWidgetId: string | null;
  deviceMode: DeviceMode;
  viewMode: ViewMode;
  isPaletteOpen: boolean;
  isInspectorOpen: boolean;
  dashboardTitle: string;
  dateRange: "7D" | "30D" | "90D" | "1Y";
  dashboardId: string | null;
  isPublishModalOpen: boolean;
  isReadOnlyView: boolean;
}

interface DashboardContextType extends DashboardUIState {
  setSelectedWidgetId: (id: string | null) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsPaletteOpen: (open: boolean) => void;
  setIsInspectorOpen: (open: boolean) => void;
  setDashboardTitle: (title: string) => void;
  setDateRange: (range: "7D" | "30D" | "90D" | "1Y") => void;
  setDashboardId: (id: string | null) => void;
  setIsPublishModalOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export interface DashboardProviderProps {
  children: React.ReactNode;
  initialWidgets?: WidgetInstance[];
  initialTitle?: string;
  initialDateRange?: "7D" | "30D" | "90D" | "1Y";
  initialDeviceMode?: DeviceMode;
  initialViewMode?: ViewMode;
  initialDashboardId?: string | null;
  isReadOnlyView?: boolean;
}

export function DashboardProvider({
  children,
  initialWidgets,
  initialTitle,
  initialDateRange,
  initialDeviceMode,
  initialViewMode,
  initialDashboardId,
  isReadOnlyView = false,
}: DashboardProviderProps) {
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [deviceMode, setDeviceModeState] = useState<DeviceMode>(
    initialDeviceMode || "desktop"
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    initialViewMode || "edit"
  );
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(
    !initialViewMode || initialViewMode === "edit"
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [dashboardTitle, setDashboardTitle] = useState<string>(
    initialTitle || "Executive Revenue & Growth"
  );
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D" | "1Y">(
    initialDateRange || "30D"
  );
  const [dashboardId, setDashboardId] = useState<string | null>(
    initialDashboardId || null
  );
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);

  // If initialWidgets is provided (e.g. from published localStorage), populate the store
  React.useEffect(() => {
    if (initialWidgets && initialWidgets.length > 0) {
      useDashboardStore.setState({ widgets: initialWidgets });
    }
  }, [initialWidgets]);

  // Desktop/Tablet toggle recomputes grid columns (12 -> 6) and reflows widget spans proportionally
  const setDeviceMode = React.useCallback(
    (newMode: DeviceMode) => {
      if (newMode === deviceMode) return;
      const currentCols = getColumnsForDevice(deviceMode);
      const targetCols = getColumnsForDevice(newMode);
      const currentWidgets = useDashboardStore.getState().widgets;
      const reflowed = reflowWidgetsForColumns(
        currentWidgets,
        targetCols,
        currentCols
      );
      useDashboardStore.getState().setWidgets(reflowed);
      setDeviceModeState(newMode);
    },
    [deviceMode]
  );

  const value = useMemo(
    () => ({
      selectedWidgetId,
      deviceMode,
      viewMode,
      isPaletteOpen,
      isInspectorOpen,
      dashboardTitle,
      dateRange,
      dashboardId,
      isPublishModalOpen,
      isReadOnlyView,
      setSelectedWidgetId,
      setDeviceMode,
      setViewMode,
      setIsPaletteOpen,
      setIsInspectorOpen,
      setDashboardTitle,
      setDateRange,
      setDashboardId,
      setIsPublishModalOpen,
    }),
    [
      selectedWidgetId,
      deviceMode,
      viewMode,
      isPaletteOpen,
      isInspectorOpen,
      dashboardTitle,
      dateRange,
      dashboardId,
      isPublishModalOpen,
      isReadOnlyView,
      setDeviceMode,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const uiContext = useContext(DashboardContext);
  const widgets = useDashboardStore((s) => s.widgets);
  const store = useDashboardStore();
  const pastStates = useStore(useDashboardStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useDashboardStore.temporal, (s) => s.futureStates);

  const fallbackUI: DashboardContextType = {
    selectedWidgetId: null,
    deviceMode: "desktop",
    viewMode: "edit",
    isPaletteOpen: true,
    isInspectorOpen: false,
    dashboardTitle: "Executive Revenue & Growth",
    dateRange: "30D",
    dashboardId: null,
    isPublishModalOpen: false,
    isReadOnlyView: false,
    setSelectedWidgetId: () => {},
    setDeviceMode: () => {},
    setViewMode: () => {},
    setIsPaletteOpen: () => {},
    setIsInspectorOpen: () => {},
    setDashboardTitle: () => {},
    setDateRange: () => {},
    setDashboardId: () => {},
    setIsPublishModalOpen: () => {},
  };

  const ui = uiContext || fallbackUI;

  return {
    ...ui,
    widgets,
    addWidget: store.addWidget,
    removeWidget: store.removeWidget,
    moveWidget: store.moveWidget,
    resizeWidget: store.resizeWidget,
    setWidgets: store.setWidgets,
    updateWidget: store.updateWidget,
    duplicateWidget: store.duplicateWidget,
    swapWidgets: store.swapWidgets,
    handleDropWidget: store.handleDropWidget,
    resetLayout: store.resetLayout,
    undo: () => useDashboardStore.temporal.getState().undo(),
    redo: () => useDashboardStore.temporal.getState().redo(),
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    historyIndex: pastStates.length,
    historyLength: pastStates.length + futureStates.length,
    pastStates,
    futureStates,
  };
}
