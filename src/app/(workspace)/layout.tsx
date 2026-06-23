import { AppSidebar } from "@/components/dashboard/sidebar";
import { getChatSessions } from "@/app/actions/chat-history";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessions = await getChatSessions().catch(() => []);

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-[#080310]">
      {/* Gemini-style sidebar */}
      <AppSidebar initialSessions={sessions} />

      {/* Main content viewport */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
