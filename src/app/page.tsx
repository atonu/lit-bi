import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { EmptyStateOverlay } from "@/components/dashboard/empty-state-overlay";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatTrigger } from "@/components/chat/chat-trigger";

export const metadata = {
  title: "Dashboard — AURA BI",
  description: "Your AI-powered business intelligence dashboard.",
};

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background bg-dot-pattern">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <TopBar />

        {/* Scrollable dashboard body */}
        <main className="relative flex-1 overflow-y-auto">
          {/* Blurred charts — client component with ssr:false dynamic imports */}
          <DashboardCharts />

          {/* Empty state overlay — floats above the blurred area */}
          <EmptyStateOverlay />
        </main>
      </div>

      {/* AI Chat — slide-in panel + floating trigger button */}
      <ChatPanel />
      <ChatTrigger />
    </div>
  );
}
