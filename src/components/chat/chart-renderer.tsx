"use client";

import { useRef, useState, useId } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, Image, Table2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCsv, exportToPng } from "@/lib/export";
import type { ChartResult } from "@/lib/stores/chat-store";
import type { QueryRow } from "@/app/actions/execute-query";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--color-popover-foreground)",
};

const AXIS_STYLE = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
} as const;

// ---------------------------------------------------------------------------
// Table view (fallback / TABLE chart type)
// ---------------------------------------------------------------------------

function DataTable({
  rows,
  columns,
}: {
  rows: QueryRow[];
  columns: string[];
}) {
  return (
    <div className="overflow-auto rounded-lg border border-border/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-left font-semibold text-muted-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={
                i % 2 === 0
                  ? "bg-background/30"
                  : "bg-muted/10"
              }
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-3 py-1.5 text-foreground/80"
                >
                  {row[col] === null || row[col] === undefined
                    ? <span className="text-muted-foreground/50 italic">null</span>
                    : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart body
// ---------------------------------------------------------------------------

function ChartBody({
  result,
  viewMode,
}: {
  result: ChartResult;
  viewMode: "chart" | "table";
}) {
  const { rows, columns, aiResponse } = result;
  const { chartType, xAxisKey, yAxisKey } = aiResponse;

  if (viewMode === "table") {
    return <DataTable rows={rows} columns={columns} />;
  }

  const commonGridProps = {
    strokeDasharray: "3 3",
    stroke: "var(--color-border)",
    opacity: 0.4,
    vertical: false,
  };

  const commonXAxisProps = {
    dataKey: xAxisKey,
    ...AXIS_STYLE,
    tickLine: false,
    axisLine: false,
  };

  const commonYAxisProps = {
    ...AXIS_STYLE,
    tickLine: false,
    axisLine: false,
    width: 56,
  };

  if (chartType === "LINE") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid {...commonGridProps} />
          <XAxis {...commonXAxisProps} />
          <YAxis {...commonYAxisProps} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Line
            type="monotone"
            dataKey={yAxisKey}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={rows.length <= 30}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "AREA") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...commonGridProps} />
          <XAxis {...commonXAxisProps} />
          <YAxis {...commonYAxisProps} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Area
            type="monotone"
            dataKey={yAxisKey}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            fill="url(#areaGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "BAR") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid {...commonGridProps} />
          <XAxis {...commonXAxisProps} />
          <YAxis {...commonYAxisProps} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Bar
            dataKey={yAxisKey}
            fill={CHART_COLORS[0]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "DONUT") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={rows}
            dataKey={yAxisKey}
            nameKey={xAxisKey}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={3}
          >
            {rows.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) => (
              <span className="text-foreground/80">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "SCATTER") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid {...commonGridProps} />
          <XAxis
            dataKey={xAxisKey}
            name={xAxisKey}
            {...AXIS_STYLE}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey={yAxisKey}
            name={yAxisKey}
            {...AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={rows} fill={CHART_COLORS[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  // Fallback: TABLE
  return <DataTable rows={rows} columns={columns} />;
}

// ---------------------------------------------------------------------------
// ChartRenderer — main export
// ---------------------------------------------------------------------------

interface ChartRendererProps {
  result: ChartResult;
  messageId: string;
}

export function ChartRenderer({ result, messageId }: ChartRendererProps) {
  const chartId = `chart-${messageId}`;
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [isExporting, setIsExporting] = useState(false);

  const { aiResponse, rows, executionMs, rowCount } = result;
  const canRenderChart = aiResponse.chartType !== "TABLE";
  const safeFilename = aiResponse.chartTitle;

  async function handleExportPng() {
    setIsExporting(true);
    try {
      await exportToPng(chartId, safeFilename);
    } finally {
      setIsExporting(false);
    }
  }

  function handleExportCsv() {
    exportToCsv(rows, safeFilename);
  }

  return (
    <div
      id={chartId}
      className="mt-2 overflow-hidden rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm"
    >
      {/* Chart header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {aiResponse.chartTitle}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {rowCount} rows · {executionMs}ms
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* View toggle */}
          {canRenderChart && (
            <div className="flex rounded-lg border border-border/40 bg-muted/30 p-0.5">
              <button
                onClick={() => setViewMode("chart")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                  viewMode === "chart"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="size-3" />
                Chart
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Table2 className="size-3" />
                Table
              </button>
            </div>
          )}
          {/* Export buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCsv}
            className="h-7 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <Download className="size-3" />
            CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPng}
            disabled={isExporting}
            className="h-7 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <Image className="size-3" />
            PNG
          </Button>
        </div>
      </div>

      {/* Chart body */}
      <div className="p-4">
        <ChartBody result={result} viewMode={viewMode} />
      </div>
    </div>
  );
}
