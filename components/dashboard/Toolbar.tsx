"use client";

import React, { useState, useEffect } from "react";
import {
  useDashboard,
  useDashboardStore,
  type DeviceMode,
} from "@/lib/dashboardStore";
import { savePublishedDashboard } from "@/lib/dashboardStorage";
import PublishModal from "./PublishModal";
import { useStore } from "zustand";
import {
  UndoIcon,
  RedoIcon,
  DesktopIcon,
  TabletIcon,
  MobileIcon,
  EyeIcon,
  EditIcon,
  ShareIcon,
  SlidersIcon,
  LayoutGridIcon,
  SparklesIcon,
} from "@/components/ui/icons";

export default function Toolbar() {
  const {
    dashboardTitle,
    setDashboardTitle,
    deviceMode,
    setDeviceMode,
    viewMode,
    setViewMode,
    isPaletteOpen,
    setIsPaletteOpen,
    isInspectorOpen,
    setIsInspectorOpen,
    dateRange,
    setDateRange,
    dashboardId,
    setDashboardId,
    setIsPublishModalOpen,
    widgets,
  } = useDashboard();

  const pastStates = useStore(useDashboardStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useDashboardStore.temporal, (s) => s.futureStates);

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Keyboard shortcuts: Cmd/Ctrl+Z for Undo, Cmd/Ctrl+Shift+Z or Ctrl+Y for Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack shortcuts when typing inside form inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey || e.metaKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useDashboardStore.temporal.getState().redo();
        } else {
          useDashboardStore.temporal.getState().undo();
        }
      } else if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        useDashboardStore.temporal.getState().redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePublish = () => {
    const record = savePublishedDashboard({
      id: dashboardId || undefined,
      title: dashboardTitle,
      widgets,
      dateRange,
      deviceMode,
    });
    setDashboardId(record.id);
    setIsPublishModalOpen(true);
  };

  return (
    <header className="h-14 shrink-0 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl px-4 flex items-center justify-between z-30 select-none">
      {/* ── Left: App Brand & Editable Title ── */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Brand Icon */}
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <SparklesIcon size={16} className="text-white" />
          </div>
          <span className="font-bold tracking-tight text-white text-sm hidden sm:inline">
            Pulse<span className="text-indigo-400 font-medium">Analytics</span>
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Dashboard Title & Status */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-xs font-semibold text-white focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="truncate text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 px-2 py-1 rounded transition-colors flex items-center gap-1.5"
              title="Click to rename dashboard"
            >
              <span className="truncate">{dashboardTitle}</span>
              <span className="text-[10px] text-slate-500">✎</span>
            </button>
          )}

          {/* Live indicator */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Synced</span>
          </div>
        </div>
      </div>

      {/* ── Center: History & Viewport Toggle ── */}
      <div className="hidden md:flex items-center gap-3">
        {/* Undo / Redo & Live History Counter */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 p-0.5">
          <button
            onClick={() => useDashboardStore.temporal.getState().undo()}
            disabled={pastStates.length === 0}
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/50 transition-colors"
            title="Undo (⌘Z / Ctrl+Z)"
          >
            <UndoIcon size={14} />
          </button>
          <button
            onClick={() => useDashboardStore.temporal.getState().redo()}
            disabled={futureStates.length === 0}
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/50 transition-colors"
            title="Redo (⌘⇧Z / Ctrl+Shift+Z)"
          >
            <RedoIcon size={14} />
          </button>
          <div className="h-3.5 w-px bg-slate-800 my-auto" />
          <span
            className="text-[10px] font-mono text-slate-400 px-1.5 select-none"
            title="History past / total recorded states"
          >
            History {pastStates.length}/{pastStates.length + futureStates.length}
          </span>
        </div>

        {/* Viewport Resizer */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-800/60 p-0.5">
          {(
            [
              { id: "desktop", icon: <DesktopIcon size={14} />, label: "Desktop" },
              { id: "tablet", icon: <TabletIcon size={14} />, label: "Tablet" },
              { id: "mobile", icon: <MobileIcon size={14} />, label: "Mobile" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setDeviceMode(m.id as DeviceMode)}
              className={[
                "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all",
                deviceMode === m.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200",
              ].join(" ")}
              title={m.label}
            >
              {m.icon}
              <span className="text-[11px] hidden xl:inline">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-800/60 p-0.5 text-xs">
          {(["7D", "30D", "90D", "1Y"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={[
                "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                dateRange === r
                  ? "bg-slate-700 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200",
              ].join(" ")}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Tool Toggles & Presentation Mode ── */}
      <div className="flex items-center gap-2">
        {/* Toggle Palette */}
        <button
          onClick={() => setIsPaletteOpen(!isPaletteOpen)}
          className={[
            "p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5",
            isPaletteOpen
              ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
              : "border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200",
          ].join(" ")}
          title="Toggle Widget Palette"
        >
          <LayoutGridIcon size={14} />
          <span className="hidden lg:inline text-[11px]">Library</span>
        </button>

        {/* Toggle Inspector */}
        <button
          onClick={() => setIsInspectorOpen(!isInspectorOpen)}
          className={[
            "p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5",
            isInspectorOpen
              ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
              : "border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200",
          ].join(" ")}
          title="Toggle Properties Inspector"
        >
          <SlidersIcon size={14} />
          <span className="hidden lg:inline text-[11px]">Inspector</span>
        </button>

        {/* View Mode (Edit vs Preview) */}
        <button
          onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
          className={[
            "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5",
            viewMode === "preview"
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20"
              : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700/80",
          ].join(" ")}
        >
          {viewMode === "edit" ? (
            <>
              <EyeIcon size={14} />
              <span>Preview</span>
            </>
          ) : (
            <>
              <EditIcon size={14} />
              <span>Edit Mode</span>
            </>
          )}
        </button>

        {/* Publish Flow */}
        <button
          onClick={handlePublish}
          className="relative px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          title="Publish dashboard and generate shareable link"
        >
          <ShareIcon size={13} />
          <span>Publish</span>
        </button>
      </div>

      {/* Publish Dialog / Modal */}
      <PublishModal />
    </header>
  );
}
