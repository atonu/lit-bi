import { getAllConnections } from "@/app/actions/ai-chat";
import { ConnectedDashboard } from "@/components/dashboard/connected-dashboard";

export const metadata = {
  title: "Dashboard — Reportbly",
  description: "View your database connections and status.",
};

export default async function DashboardPage() {
  const connections = await getAllConnections();

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <ConnectedDashboard connections={connections} />
    </main>
  );
}
