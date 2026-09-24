"use client";

import React, { useState } from "react";
import { useDashboard } from "@/lib/dashboardStore";
import type { WidgetType } from "@/lib/gridMath";
import { useDraggable } from "@dnd-kit/core";
import {
  SearchIcon,
  PlusIcon,
  HashIcon,
  ChartAreaIcon,
  ChartBarIcon,
  TableIcon,
  SparklesIcon,
  GripIcon,
} from "@/components/ui/icons";

export interface PaletteWidgetDefinition {
  id: string;
  type: WidgetType;
  label: string;
  description: string;
  defaultCols: number;
  defaultRows: number;
  icon: React.ReactNode;
}

export const PALETTE_DEFINITIONS: { heading: string; items: PaletteWidgetDefinition[] }[] = [
  {
    heading: "Executive KPIs",
    items: [
      {
        id: "palette-number",
        type: "number",
        label: "Metric Card",
        description: "High-impact KPI number with delta comparison",
        defaultCols: 4,
        defaultRows: 2,
        icon: <HashIcon size={18} className="text-cyan-400" />,
      },
      {
        id: "palette-sparkline",
        type: "sparkline",
        label: "Sparkline KPI",
        description: "KPI number accompanied by historical trendline",
        defaultCols: 4,
        defaultRows: 2,
        icon: <SparklesIcon size={18} className="text-indigo-400" />,
      },
    ],
  },
  {
    heading: "Visual Analytics",
    items: [
      {
        id: "palette-line",
        type: "line",
        label: "Time Series Area/Line",
        description: "Historical metrics with range selector",
        defaultCols: 8,
        defaultRows: 3,
        icon: <ChartAreaIcon size={18} className="text-indigo-400" />,
      },
      {
        id: "palette-bar",
        type: "bar",
        label: "Bar Chart",
        description: "Categorical benchmarks and quarterly variance",
        defaultCols: 6,
        defaultRows: 3,
        icon: <ChartBarIcon size={18} className="text-cyan-400" />,
      },
      {
        id: "palette-scatter",
        type: "scatter",
        label: "Scatter Correlation",
        description: "Deal velocity vs. ACV cluster distribution",
        defaultCols: 6,
        defaultRows: 3,
        icon: <SparklesIcon size={18} className="text-violet-400" />,
      },
      {
        id: "palette-barList",
        type: "barList",
        label: "Bar List Ranking",
        description: "Ranked tiers with MoM growth rates",
        defaultCols: 4,
        defaultRows: 3,
        icon: <ChartBarIcon size={18} className="text-emerald-400" />,
      },
    ],
  },
  {
    heading: "Tables & Narrative",
    items: [
      {
        id: "palette-table",
        type: "table",
        label: "Invoices & Records",
        description: "Filterable tabular grid with status badges",
        defaultCols: 8,
        defaultRows: 3,
        icon: <TableIcon size={18} className="text-amber-400" />,
      },
      {
        id: "palette-text",
        type: "text",
        label: "Executive Briefing",
        description: "Editable commentary notes and quarterly narrative",
        defaultCols: 4,
        defaultRows: 2,
        icon: <HashIcon size={18} className="text-pink-400" />,
      },
    ],
  },
];

function DraggablePaletteItem({
  item,
  isJustAdded,
  onAdd,
}: {
  item: PaletteWidgetDefinition;
  isJustAdded: boolean;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      isPaletteItem: true,
      type: item.type,
      label: item.label,
      defaultCols: item.defaultCols,
      defaultRows: item.defaultRows,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Draggable ${item.label} widget template`}
      onClick={onAdd}
      className={[
        "w-full group text-left rounded-xl p-2.5 border transition-all duration-150 flex items-start gap-3 select-none cursor-grab active:cursor-grabbing",
        isDragging
          ? "opacity-30 border-indigo-500 bg-indigo-500/10"
          : isJustAdded
          ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
          : "border-slate-800/80 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80",
      ].join(" ")}
    >
      <div className="rounded-lg bg-slate-800 p-2 border border-slate-700/50 group-hover:scale-105 transition-transform shrink-0">
        {item.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
            {item.label}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {item.defaultCols}×{item.defaultRows}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-1">
          {item.description}
        </p>
      </div>

      <div className="shrink-0 self-center flex items-center gap-1">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="size-6 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:border-indigo-500 group-hover:text-white transition-colors"
          title="Click to add to canvas"
        >
          <PlusIcon size={12} />
        </div>
      </div>
    </div>
  );
}

export default function WidgetPalette() {
  const [query, setQuery] = useState("");
  const { addWidget, isPaletteOpen } = useDashboard();
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  if (!isPaletteOpen) return null;

  const filteredGroups = query.trim()
    ? PALETTE_DEFINITIONS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter((group) => group.items.length > 0)
    : PALETTE_DEFINITIONS;

  const handleAdd = (item: PaletteWidgetDefinition) => {
    addWidget(item.type, {
      gridSpan: { cols: item.defaultCols, rows: item.defaultRows },
      config: { title: item.label },
    });
    setRecentlyAdded(item.id);
    setTimeout(() => setRecentlyAdded(null), 1200);
  };

  return (
    <aside className="w-72 shrink-0 border-r border-slate-800/80 bg-slate-900/95 backdrop-blur-xl flex flex-col h-full z-10 select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Widget Library
          </span>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            Drag & drop
          </span>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <SearchIcon
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            placeholder="Search widgets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-800/70 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {filteredGroups.map((group) => (
          <div key={group.heading} className="space-y-1.5">
            <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.heading}
            </h4>

            <div className="space-y-1">
              {group.items.map((item) => (
                <DraggablePaletteItem
                  key={item.id}
                  item={item}
                  isJustAdded={recentlyAdded === item.id}
                  onAdd={() => handleAdd(item)}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No widgets found for &quot;{query}&quot;
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
        <GripIcon size={12} className="text-indigo-400" />
        <span>Drag to place or click to add</span>
      </div>
    </aside>
  );
}
