"use client";

import React from "react";
import Toolbar from "./Toolbar";
import DashboardWorkspace from "./DashboardWorkspace";
import { useDashboard } from "@/lib/dashboardStore";

export default function DashboardApp() {
  const { viewMode } = useDashboard();
  const isPreview = viewMode === "preview";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#080c14] text-slate-100 relative">
      {/* Top Toolbar: hidden in read-only preview mode per specification */}
      {!isPreview && <Toolbar />}

      {/* Main Workspace (palette, canvas, inspector) */}
      <DashboardWorkspace />
    </div>
  );
}

