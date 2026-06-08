import { getAllConnections } from "@/app/actions/ai-chat";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { getChatSessions } from "@/app/actions/chat-history";
import { ConnectedDashboard } from "@/components/dashboard/connected-dashboard";

export const metadata = {
  title: "Dashboard — BI-Lite",
  description: "View your database connections and status.",
};

export default async function DashboardPage() {
  const [connections, sessions] = await Promise.all([
    getAllConnections(),
    getChatSessions(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#131314]">
      <AppSidebar initialSessions={sessions} />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <ConnectedDashboard connections={connections} />
      </main>
    </div>
  );
}
