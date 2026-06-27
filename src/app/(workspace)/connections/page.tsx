import { getAllConnections } from "@/app/actions/ai-chat";
import { ConnectionsPageClient } from "./page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connections — Reportbly",
  description: "Manage your database connections.",
};

export default async function ConnectionsPage() {
  const connections = await getAllConnections();

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <ConnectionsPageClient connections={connections} />
    </main>
  );
}
