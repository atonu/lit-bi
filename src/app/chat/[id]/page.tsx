import { AppSidebar } from "@/components/dashboard/sidebar";
import { ChatMain } from "@/components/chat/chat-main";
import { getConnections } from "@/app/actions/ai-chat";
import { getChatSessions, getChatMessages } from "@/app/actions/chat-history";
import { notFound } from "next/navigation";

export const metadata = {
  title: "BI-Lite — AI Data Chat",
  description: "Ask questions about your data in plain English.",
};

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [connections, sessions, initialMessages] = await Promise.all([
    getConnections(),
    getChatSessions(),
    getChatMessages(id),
  ]);

  // Validate session exists in history
  const sessionExists = sessions.some(s => s.id === id);
  if (!sessionExists) {
    // We could notFound() here, but the session might be created but not fully synced yet
    // However, for strict parameterization, it's safer to ensure it exists or redirect.
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#131314]">
      <AppSidebar initialSessions={sessions} />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ChatMain 
          initialConnections={connections} 
          chatId={id} 
          initialMessages={initialMessages} 
        />
      </main>
    </div>
  );
}
