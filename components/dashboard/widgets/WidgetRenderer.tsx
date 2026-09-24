"use client";

import React from "react";
import type { WidgetInstance } from "@/lib/gridMath";
import MetricCardWidget from "./MetricCardWidget";
import ChartCardWidget from "./ChartCardWidget";
import BarListCardWidget from "./BarListCardWidget";
import TableCardWidget from "./TableCardWidget";
import ScatterCardWidget from "./ScatterCardWidget";
import TextCardWidget from "./TextCardWidget";
import {
  revenueChartData,
  revenueByPlanData,
  invoicesData,
} from "@/lib/mockData";

interface WidgetRendererProps {
  widget: WidgetInstance;
}

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  const { id, type, gridSpan, config } = widget;
  const title = config?.title || "Widget";
  const colSpan = gridSpan.cols;

  switch (type) {
    case "number":
      return (
        <MetricCardWidget
          id={id}
          title={title}
          colSpan={colSpan}
          data={{
            value: (config?.value as string) || "$248,920",
            delta: (config?.delta as string) || "+14.2%",
            deltaPositive: (config?.deltaPositive as boolean) ?? true,
            subtext: config?.comparisonLabel || "vs. last month",
          }}
          showSparkline={false}
          comparisonLabel={config?.comparisonLabel}
        />
      );

    case "sparkline":
      return (
        <MetricCardWidget
          id={id}
          title={title}
          colSpan={colSpan}
          data={{
            value: (config?.value as string) || "$482,190",
            delta: (config?.delta as string) || "+12.4%",
            deltaPositive: (config?.deltaPositive as boolean) ?? true,
            subtext: config?.comparisonLabel || "Pacing +3.7% above baseline",
          }}
          showSparkline={true}
          comparisonLabel={config?.comparisonLabel}
        />
      );

    case "bar":
      return (
        <ChartCardWidget
          id={id}
          title={title}
          colSpan={colSpan}
          data={revenueChartData}
          chartType="bar"
        />
      );

    case "line":
      return (
        <ChartCardWidget
          id={id}
          title={title}
          colSpan={colSpan}
          data={revenueChartData}
          chartType="line"
        />
      );

    case "scatter":
      return <ScatterCardWidget id={id} title={title} colSpan={colSpan} />;

    case "barList":
      return (
        <BarListCardWidget
          id={id}
          title={title}
          colSpan={colSpan}
          data={revenueByPlanData}
        />
      );

    case "table":
      return (
        <TableCardWidget
          id={id}
          title={title}
          colSpan={colSpan}
          data={invoicesData}
        />
      );

    case "text":
      return (
        <TextCardWidget
          id={id}
          title={title}
          colSpan={colSpan}
          config={config}
        />
      );

    default:
      return null;
  }
}
