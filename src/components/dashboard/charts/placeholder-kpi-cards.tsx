"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  sparklineData: number[];
  colorVar: string;
  delay: number;
}

function KpiCard({
  title,
  value,
  change,
  sparklineData,
  colorVar,
  delay,
}: KpiCardProps) {
  const isPositive = change >= 0;
  const chartData = sparklineData.map((v, i) => ({ idx: i, val: v }));

  return (
    <Card
      className={`animate-fade-in border-border/40 bg-card/50 backdrop-blur-sm`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {isPositive ? "+" : ""}
          {change}%
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id={`gradient-${colorVar}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={`var(--color-${colorVar})`}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={`var(--color-${colorVar})`}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="val"
                stroke={`var(--color-${colorVar})`}
                strokeWidth={1.5}
                fill={`url(#gradient-${colorVar})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const kpiData: Omit<KpiCardProps, "delay">[] = [
  {
    title: "Total Revenue",
    value: "$284,392",
    change: 12.5,
    sparklineData: [30, 45, 38, 52, 48, 65, 58, 72, 68, 85, 78, 92],
    colorVar: "chart-1",
  },
  {
    title: "Active Users",
    value: "14,832",
    change: 8.2,
    sparklineData: [20, 35, 30, 42, 50, 48, 55, 62, 58, 70, 65, 75],
    colorVar: "chart-2",
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: -2.1,
    sparklineData: [45, 42, 48, 40, 38, 42, 35, 38, 32, 36, 30, 34],
    colorVar: "chart-3",
  },
  {
    title: "Avg. Order Value",
    value: "$67.40",
    change: 5.7,
    sparklineData: [25, 30, 28, 35, 32, 40, 38, 45, 42, 48, 50, 55],
    colorVar: "chart-4",
  },
];

export function PlaceholderKpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiData.map((kpi, i) => (
        <KpiCard key={kpi.title} {...kpi} delay={50 + i * 75} />
      ))}
    </div>
  );
}
