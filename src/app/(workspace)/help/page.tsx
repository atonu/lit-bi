import { HelpContent } from "./help-content";

export const metadata = {
  title: "Help & Documentation — Reportbly",
  description: "Learn how to connect databases, write questions, and get insights with Reportbly.",
};

export default function HelpPage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#080310]">
      <HelpContent />
    </main>
  );
}
