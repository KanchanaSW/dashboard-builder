"use client";

import React, { useState } from "react";
import WidgetCard from "./WidgetCard";
import type { Invoice, InvoiceStatus } from "@/lib/mockData";
import { SearchIcon } from "@/components/ui/icons";

interface TableCardWidgetProps {
  id: string;
  title: string;
  colSpan: number;
  data: Invoice[];
}

const statusStyles: Record<
  InvoiceStatus,
  { bg: string; text: string; ring: string; label: string }
> = {
  PAID: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    ring: "ring-emerald-500/20",
    label: "Settled",
  },
  OVERDUE: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    ring: "ring-rose-500/20",
    label: "Overdue",
  },
  PENDING: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    ring: "ring-amber-500/20",
    label: "Pending",
  },
  PROCESSING: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    ring: "ring-cyan-500/20",
    label: "Processing",
  },
};

export default function TableCardWidget({
  id,
  title,
  colSpan,
  data,
}: TableCardWidgetProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const filtered = data.filter((item) => {
    const matchesFilter = filter === "ALL" || item.status === filter;
    const matchesSearch =
      item.customer.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.plan.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <WidgetCard
      id={id}
      title={title}
      colSpan={colSpan}
      actionNode={
        <div className="flex items-center gap-2">
          {/* Status filter tabs */}
          <div className="hidden sm:flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-xs">
            {(["ALL", "PAID", "PENDING", "OVERDUE"] as const).map((tab) => (
              <button
                key={tab}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter(tab);
                }}
                className={[
                  "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize transition-all",
                  filter === tab
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200",
                ].join(" ")}
              >
                {tab === "ALL" ? "All" : tab.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Search Bar */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <SearchIcon
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Filter transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-lg border border-slate-800 bg-slate-800/60 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filtered.length} of {data.length} records
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-2.5">Invoice ID</th>
              <th className="px-4 py-2.5">Enterprise Client</th>
              <th className="px-4 py-2.5">Contract Plan</th>
              <th className="px-4 py-2.5">Settlement Date</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((row) => {
              const style = statusStyles[row.status] || statusStyles.PENDING;
              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-slate-400 font-medium">
                    {row.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {row.customer.slice(0, 2)}
                      </div>
                      <span className="font-semibold text-slate-200">
                        {row.customer}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.plan}</td>
                  <td className="px-4 py-3 text-slate-400">{row.date || "Sep 2026"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                        style.bg,
                        style.text,
                        style.ring,
                      ].join(" ")}
                    >
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                    {row.amount}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No invoices match your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetCard>
  );
}
