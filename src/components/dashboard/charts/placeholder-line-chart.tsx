"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Jan", revenue: 4200, users: 2400 },
  { month: "Feb", revenue: 5800, users: 3200 },
  { month: "Mar", revenue: 5200, users: 2800 },
  { month: "Apr", revenue: 7800, users: 4100 },
  { month: "May", revenue: 6900, users: 3800 },
  { month: "Jun", revenue: 9200, users: 5200 },
  { month: "Jul", revenue: 8400, users: 4800 },
  { month: "Aug", revenue: 10800, users: 6100 },
  { month: "Sep", revenue: 9600, users: 5500 },
  { month: "Oct", revenue: 12400, users: 7200 },
  { month: "Nov", revenue: 11200, users: 6800 },
  { month: "Dec", revenue: 14800, users: 8400 },
];

export function PlaceholderLineChart() {
  return (
    <Card className="animate-fade-in border-border/40 bg-card/50 backdrop-blur-sm stagger-5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            Revenue Over Time
          </CardTitle>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Last 12 months
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                opacity={0.4}
              />
              <XAxis
                dataKey="month"
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
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="users"
                name="Users"
                stroke="var(--color-chart-2)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
