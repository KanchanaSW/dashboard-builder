"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/lib/dashboardStore";
import {
  CheckIcon,
  CopyIcon,
  SparklesIcon,
  EyeIcon,
} from "@/components/ui/icons";

export default function PublishModal() {
  const {
    isPublishModalOpen,
    setIsPublishModalOpen,
    dashboardId,
    dashboardTitle,
    widgets,
    deviceMode,
    dateRange,
  } = useDashboard();

  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (!dashboardId) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/dashboard/${dashboardId}/view`;
    }
    return `/dashboard/${dashboardId}/view`;
  }, [dashboardId]);

  if (!isPublishModalOpen || !dashboardId) return null;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl text-slate-100 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-3 text-slate-950 shadow-lg shadow-emerald-500/20">
              <SparklesIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Dashboard Published
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Ready to Share
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Current dashboard state persisted locally and ready for preview.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPublishModalOpen(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Shareable Link Box */}
        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Shareable Local Route
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 selection:bg-indigo-500/30"
            />
            <button
              onClick={handleCopy}
              className={[
                "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shadow-md",
                copied
                  ? "bg-emerald-600 text-white shadow-emerald-600/20"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20",
              ].join(" ")}
            >
              {copied ? (
                <>
                  <CheckIcon size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs">
          <div className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
              Dashboard Title
            </span>
            <span className="font-semibold text-white truncate block">
              {dashboardTitle}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
              Widgets & Layout
            </span>
            <span className="font-semibold text-white block capitalize">
              {widgets.length} widgets • {deviceMode}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
              Date Filter
            </span>
            <span className="font-semibold text-indigo-300 block">
              {dateRange} Window
            </span>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
              Storage Engine
            </span>
            <span className="font-semibold text-emerald-400 block font-mono text-[11px]">
              Browser LocalStorage
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setIsPublishModalOpen(false)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-750 transition-colors"
          >
            Done
          </button>
          <a
            href={`/dashboard/${dashboardId}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <EyeIcon size={14} />
            <span>Open Preview Route</span>
          </a>
        </div>
      </div>
    </div>
  );
}
