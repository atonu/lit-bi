import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { EmptyStateOverlay } from "@/components/dashboard/empty-state-overlay";
import { ConnectedDashboard } from "@/components/dashboard/connected-dashboard";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatTrigger } from "@/components/chat/chat-trigger";
import { getConnections } from "@/app/actions/ai-chat";

export const metadata = {
  title: "Dashboard — AURA BI",
  description: "Your AI-powered business intelligence dashboard.",
};

export default async function DashboardPage() {
  // Server-side check: does at least one active connection exist?
  const connections = await getConnections();
  const hasConnections = connections.length > 0;

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
          {hasConnections ? (
            // Real dashboard once a connection is saved
            <ConnectedDashboard connections={connections} />
          ) : (
            // Blurred placeholder + "Connect" CTA when no connections exist
            <>
              <DashboardCharts />
              <EmptyStateOverlay />
            </>
          )}
        </main>
      </div>

      {/* AI Chat — slide-in panel + floating trigger button */}
      <ChatPanel />
      <ChatTrigger />
    </div>
  );
}
