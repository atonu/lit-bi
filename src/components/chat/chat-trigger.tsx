"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, Sparkles } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";
import { getConnections } from "@/app/actions/ai-chat";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ChatTrigger
// ---------------------------------------------------------------------------
// A floating button in the bottom-right corner of the dashboard that opens
// the AI chat panel. It only shows an "active" indicator if the user has at
// least one connected database.
// ---------------------------------------------------------------------------

export function ChatTrigger() {
  const { setChatOpen, isChatOpen, setActiveConnection } = useChatStore();
  const [hasConnections, setHasConnections] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    getConnections().then((conns) => {
      if (conns.length > 0) {
        setHasConnections(true);
        setPulse(true);
        // Stop pulsing after 6 seconds
        setTimeout(() => setPulse(false), 6000);
      }
    });
  }, []);

  async function handleOpen() {
    const conns = await getConnections();
    if (conns.length > 0) {
      setActiveConnection(conns[0].id, conns[0].alias);
    } else {
      setChatOpen(true);
    }
  }

  if (isChatOpen) return null;

  return (
    <button
      onClick={handleOpen}
      className={cn(
        "group fixed bottom-6 right-6 z-30 flex items-center gap-2.5 overflow-hidden rounded-full shadow-2xl shadow-black/30 transition-all duration-300",
        hasConnections
          ? "bg-gradient-to-r from-chart-1 to-chart-5 pl-4 pr-5 py-3 text-white hover:shadow-chart-1/30 hover:brightness-110 active:scale-95"
          : "bg-muted/80 border border-border/50 pl-4 pr-5 py-3 text-muted-foreground hover:bg-muted hover:text-foreground backdrop-blur-sm"
      )}
      title="Ask your data a question"
    >
      {/* Pulse ring — shown only when first connected */}
      {pulse && (
        <span className="absolute inset-0 animate-ping rounded-full bg-chart-1/40" />
      )}

      <Sparkles className={cn("size-4 shrink-0", hasConnections && "text-white")} />
      <span className="text-sm font-semibold">Ask AI</span>
    </button>
  );
}
