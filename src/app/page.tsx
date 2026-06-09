import { AppSidebar } from "@/components/dashboard/sidebar";
import { ChatMain } from "@/components/chat/chat-main";
import { getConnections } from "@/app/actions/ai-chat";
import { getChatSessions } from "@/app/actions/chat-history";

export const metadata = {
  title: "BI-Lite — AI Data Chat",
  description: "Ask questions about your data in plain English.",
};

export default async function HomePage() {
  const [connections, sessions] = await Promise.all([
    getConnections(),
    getChatSessions(),
  ]);

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-[#131314]">
      {/* Gemini-style sidebar */}
      <AppSidebar initialSessions={sessions} />

      {/* Main chat area */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ChatMain initialConnections={connections} />
      </main>
    </div>
  );
}
