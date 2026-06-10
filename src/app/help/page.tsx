import { AppSidebar } from "@/components/dashboard/sidebar";
import { getChatSessions } from "@/app/actions/chat-history";
import { HelpContent } from "./help-content";

export const metadata = {
  title: "Help & Documentation — BI-Lite",
  description: "Learn how to connect databases, write questions, and get insights with BI-Lite.",
};

export default async function HelpPage() {
  const sessions = await getChatSessions();

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-[#131314]">
      <AppSidebar initialSessions={sessions} />
      {/* main is NOT the scroll container — HelpContent owns its own scroll div */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#131314]">
        <HelpContent />
      </main>
    </div>
  );
}
