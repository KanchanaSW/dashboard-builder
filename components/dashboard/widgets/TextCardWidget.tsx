"use client";

import React, { useState } from "react";
import WidgetCard from "./WidgetCard";
import { useDashboard } from "@/lib/dashboardStore";

interface TextCardWidgetProps {
  id: string;
  title: string;
  colSpan: number;
  config?: {
    content?: string;
    [key: string]: unknown;
  };
}

const DEFAULT_CONTENT =
  "Q3 executive pacing is currently trending 14.2% above baseline targets. High enterprise contract renewals and improved net retention in Tier-1 accounts are driving strong margin expansion across all regional clusters.";

export default function TextCardWidget({
  id,
  title,
  colSpan,
  config,
}: TextCardWidgetProps) {
  const { updateWidget, viewMode } = useDashboard();
  const [isEditing, setIsEditing] = useState(false);
  const content = (config?.content as string) || DEFAULT_CONTENT;

  return (
    <WidgetCard id={id} title={title} colSpan={colSpan}>
      <div className="flex flex-col flex-1 justify-between">
        {isEditing && viewMode === "edit" ? (
          <textarea
            autoFocus
            value={content}
            onChange={(e) =>
              updateWidget(id, {
                config: { ...config, content: e.target.value },
              })
            }
            onBlur={() => setIsEditing(false)}
            className="w-full h-full min-h-[90px] rounded-lg border border-indigo-500 bg-slate-800/80 p-2.5 text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
          />
        ) : (
          <div
            onClick={() => viewMode === "edit" && setIsEditing(true)}
            className={`text-xs text-slate-300 leading-relaxed font-normal ${
              viewMode === "edit" ? "hover:text-white cursor-pointer" : ""
            }`}
            title={viewMode === "edit" ? "Click to edit text commentary" : undefined}
          >
            <p className="whitespace-pre-line">{content}</p>
          </div>
        )}

        <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-indigo-400" />
            Executive Briefing Note
          </span>
          {viewMode === "edit" && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Edit note
            </button>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}

