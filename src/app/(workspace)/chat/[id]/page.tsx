import { ChatMain } from "@/components/chat/chat-main";
import { getConnections } from "@/app/actions/ai-chat";
import { getChatMessages } from "@/app/actions/chat-history";

export const metadata = {
  title: "Reportbly — AI Data Chat",
  description: "Ask questions about your data in plain English.",
};

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [connections, initialMessages] = await Promise.all([
    getConnections(),
    getChatMessages(id),
  ]);

  return (
    <ChatMain 
      initialConnections={connections} 
      chatId={id} 
      initialMessages={initialMessages} 
    />
  );
}
