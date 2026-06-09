import { getAllConnections } from "@/app/actions/ai-chat";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { getChatSessions } from "@/app/actions/chat-history";
import { ConnectionsPageClient } from "./page-client";

export const metadata = {
  title: "Connections — BI-Lite",
  description: "Manage your database connections.",
};

export default async function ConnectionsPage() {
  const [connections, sessions] = await Promise.all([
    getAllConnections(),
    getChatSessions(),
  ]);

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-[#131314]">
      <AppSidebar initialSessions={sessions} />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <ConnectionsPageClient connections={connections} />
      </main>
    </div>
  );
}
