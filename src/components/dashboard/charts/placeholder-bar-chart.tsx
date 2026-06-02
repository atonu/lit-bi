"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { region: "North", q1: 4800, q2: 5200, q3: 6800 },
  { region: "South", q1: 3600, q2: 4100, q3: 5200 },
  { region: "East", q1: 5200, q2: 6300, q3: 7100 },
  { region: "West", q1: 4100, q2: 4800, q3: 5800 },
  { region: "Central", q1: 3200, q2: 3800, q3: 4500 },
];

export function PlaceholderBarChart() {
  return (
    <Card className="animate-fade-in border-border/40 bg-card/50 backdrop-blur-sm stagger-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            Sales by Region
          </CardTitle>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Quarterly
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                opacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="region"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) =>
                  `$${(val / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--color-popover-foreground)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
              <Bar
                dataKey="q1"
                name="Q1"
                fill="var(--color-chart-1)"
                radius={[4, 4, 0, 0]}
                opacity={0.9}
              />
              <Bar
                dataKey="q2"
                name="Q2"
                fill="var(--color-chart-3)"
                radius={[4, 4, 0, 0]}
                opacity={0.9}
              />
              <Bar
                dataKey="q3"
                name="Q3"
                fill="var(--color-chart-5)"
                radius={[4, 4, 0, 0]}
                opacity={0.9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
