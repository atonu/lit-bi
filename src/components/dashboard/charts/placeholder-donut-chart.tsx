"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Enterprise", value: 4200 },
  { name: "Pro", value: 3100 },
  { name: "Starter", value: 2800 },
  { name: "Free", value: 1900 },
  { name: "Trial", value: 800 },
];

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function PlaceholderDonutChart() {
  return (
    <Card className="animate-fade-in border-border/40 bg-card/50 backdrop-blur-sm stagger-7">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            User Distribution
          </CardTitle>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            By plan
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex h-[280px] items-center gap-6">
          {/* Donut Chart */}
          <div className="h-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--color-popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2.5 pr-2">
            {data.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2.5">
                <div
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {entry.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {entry.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
