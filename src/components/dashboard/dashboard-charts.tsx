"use client";

import dynamic from "next/dynamic";

// Dynamically import all Recharts-based components with ssr: false.
// This must live in a Client Component — Next.js App Router forbids
// ssr: false in Server Components.
const PlaceholderKpiCards = dynamic(
  () =>
    import("@/components/dashboard/charts/placeholder-kpi-cards").then(
      (m) => m.PlaceholderKpiCards
    ),
  { ssr: false }
);

const PlaceholderLineChart = dynamic(
  () =>
    import("@/components/dashboard/charts/placeholder-line-chart").then(
      (m) => m.PlaceholderLineChart
    ),
  { ssr: false }
);

const PlaceholderBarChart = dynamic(
  () =>
    import("@/components/dashboard/charts/placeholder-bar-chart").then(
      (m) => m.PlaceholderBarChart
    ),
  { ssr: false }
);

const PlaceholderDonutChart = dynamic(
  () =>
    import("@/components/dashboard/charts/placeholder-donut-chart").then(
      (m) => m.PlaceholderDonutChart
    ),
  { ssr: false }
);

const activityItems = [
  { label: "Query executed", time: "2m ago", color: "bg-chart-2" },
  { label: "Report generated", time: "14m ago", color: "bg-chart-1" },
  { label: "Schema refreshed", time: "1h ago", color: "bg-chart-3" },
  { label: "User connected", time: "3h ago", color: "bg-chart-4" },
  { label: "Export downloaded", time: "5h ago", color: "bg-chart-5" },
];

export function DashboardCharts() {
  return (
    <div
      className="min-h-full p-6"
      style={{
        filter: "blur(3px)",
        opacity: 0.45,
        pointerEvents: "none",
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Overview</h2>
          <p className="text-xs text-muted-foreground">Updated just now</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
          Last 30 days
        </div>
      </div>

      {/* KPI Cards */}
      <PlaceholderKpiCards />

      {/* Charts grid */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PlaceholderLineChart />
        <PlaceholderBarChart />
        <PlaceholderDonutChart />

        {/* Activity feed placeholder */}
        <div className="animate-fade-in stagger-8 flex flex-col gap-3 rounded-xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Recent Activity
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Live
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {activityItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className={`size-1.5 shrink-0 rounded-full ${item.color}`}
                />
                <span className="flex-1 text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
