import { ChatMain } from "@/components/chat/chat-main";
import { getConnections } from "@/app/actions/ai-chat";

export const metadata = {
  title: "BI-Lite — AI Data Chat",
  description: "Ask questions about your data in plain English.",
};

export default async function HomePage() {
  const connections = await getConnections();

  return <ChatMain initialConnections={connections} />;
}
