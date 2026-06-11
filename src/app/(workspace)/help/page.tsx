import { HelpContent } from "./help-content";

export const metadata = {
  title: "Help & Documentation — BI-Lite",
  description: "Learn how to connect databases, write questions, and get insights with BI-Lite.",
};

export default function HelpPage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#131314]">
      <HelpContent />
    </main>
  );
}
