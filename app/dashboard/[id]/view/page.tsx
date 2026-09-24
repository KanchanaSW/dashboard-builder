"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getPublishedDashboard,
  type PublishedDashboard,
} from "@/lib/dashboardStorage";
import {
  DashboardProvider,
  useDashboard,
  type DeviceMode,
} from "@/lib/dashboardStore";
import DashboardCanvas from "@/components/dashboard/DashboardCanvas";
import {
  SparklesIcon,
  DesktopIcon,
  TabletIcon,
  ShareIcon,
  CheckIcon,
  EditIcon,
  LayoutGridIcon,
} from "@/components/ui/icons";

/**
 * Top slim read-only bar for the published shareable dashboard view.
 */
function PublishedViewHeader() {
  const {
    dashboardTitle,
    deviceMode,
    setDeviceMode,
  } = useDashboard();

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <header className="h-14 shrink-0 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* Brand & Dashboard Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
          title="Open in Builder"
        >
          <div className="size-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <SparklesIcon size={16} className="text-white" />
          </div>
          <span className="font-bold tracking-tight text-white text-sm hidden sm:inline">
            Pulse<span className="text-indigo-400 font-medium">Analytics</span>
          </span>
        </Link>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-xs font-semibold text-white">
            {dashboardTitle}
          </span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Published</span>
          </span>
        </div>
      </div>

      {/* Center: Device Mode Viewport Switcher */}
      <div className="hidden md:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 p-0.5">
        {(
          [
            { id: "desktop", icon: <DesktopIcon size={14} />, label: "Desktop (12c)" },
            { id: "tablet", icon: <TabletIcon size={14} />, label: "Tablet (6c)" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => setDeviceMode(m.id as DeviceMode)}
            className={[
              "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all",
              deviceMode === m.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200",
            ].join(" ")}
            title={m.label}
          >
            {m.icon}
            <span className="text-[11px]">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          title="Copy shareable link"
        >
          {copied ? (
            <>
              <CheckIcon size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <ShareIcon size={13} />
              <span className="hidden sm:inline">Share Link</span>
            </>
          )}
        </button>

        {/* Builder Link */}
        <Link
          href="/dashboard"
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          title="Open Dashboard Builder"
        >
          <EditIcon size={13} />
          <span className="hidden sm:inline">Edit in Builder</span>
        </Link>
      </div>
    </header>
  );
}

export default function PublishedDashboardViewPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [dashboard, setDashboard] = useState<PublishedDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => {
      const loaded = getPublishedDashboard(id);
      setDashboard(loaded);
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  // Loading state with executive skeleton shimmer
  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080c14] text-slate-400 gap-4">
        <div className="size-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse border border-indigo-500/30">
          <SparklesIcon size={20} />
        </div>
        <p className="text-xs font-medium text-slate-400 animate-pulse">
          Loading published dashboard...
        </p>
      </div>
    );
  }

  // Not found state: ID does not exist in LocalStorage
  if (!dashboard) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080c14] text-slate-200 p-6">
        <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="mx-auto size-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 mb-4">
            <LayoutGridIcon size={28} />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Dashboard Not Found
          </h1>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            No published dashboard with identifier{" "}
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">
              {id}
            </code>{" "}
            was found in your browser&apos;s local storage.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <SparklesIcon size={14} />
              <span>Go to Dashboard Builder</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render published state in read-only Preview mode
  return (
    <DashboardProvider
      initialWidgets={dashboard.widgets}
      initialTitle={dashboard.title}
      initialDateRange={dashboard.dateRange}
      initialDeviceMode={dashboard.deviceMode}
      initialViewMode="preview"
      isReadOnlyView={true}
      initialDashboardId={dashboard.id}
    >
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
        <PublishedViewHeader />
        {/* Same canvas in read-only Preview mode: no palette, no toolbar, no drag chrome */}
        <DashboardCanvas />
      </div>
    </DashboardProvider>
  );
}
