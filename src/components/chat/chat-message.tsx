"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, User, AlertCircle, Loader2, Code2, ChevronDown, ChevronUp } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/stores/chat-store";
import dynamic from "next/dynamic";

// ChartRenderer uses Recharts which requires browser-only APIs
const ChartRendererDynamic = dynamic(
  () => import("./chart-renderer").then((m) => m.ChartRenderer),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Thinking indicator
// ---------------------------------------------------------------------------

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-white/40">
      <Loader2 className="size-4 animate-spin text-blue-400/80" />
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatMessageBubble
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const [showQuery, setShowQuery] = useState(false);

  const isUser = message.role === "user";
  const isError = message.role === "error";
  const isThinking = message.status === "thinking";
  const isExecuting = message.status === "executing";

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-3">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-white/[0.08] px-5 py-3 text-sm text-white/90 ring-1 ring-white/[0.06]">
          {message.content}
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
          A
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
          <AlertCircle className="size-4 text-white/40" />
        </div>
        <div className="min-w-0 flex-1 pt-1.5">
          <p className="text-sm leading-relaxed text-white/70">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full ring-1 transition-all",
          isThinking || isExecuting
            ? "bg-blue-500/10 ring-blue-500/20"
            : "bg-gradient-to-br from-blue-500/20 to-violet-600/20 ring-white/10"
        )}
      >
        <Sparkles
          className={cn(
            "size-4",
            isThinking || isExecuting
              ? "animate-pulse text-blue-400"
              : "text-blue-400"
          )}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {isThinking && (
          <ThinkingIndicator label="Analyzing schema and generating query…" />
        )}
        {isExecuting && (
          <ThinkingIndicator label="Executing query on your database…" />
        )}

        {message.status === "done" && (
          <>
            {message.content && (
              <p className="text-sm leading-relaxed text-white/70">
                {message.content}
              </p>
            )}
            {message.chartResult && (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setShowQuery(!showQuery)}
                    className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
                  >
                    <Code2 className="size-3.5" />
                    <span>{showQuery ? "Hide" : "View"} Generated Query</span>
                    {showQuery ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  </button>
                </div>
                {showQuery && (
                  <div className="mt-2 rounded-md bg-white/5 p-3 font-mono text-xs text-white/80 overflow-x-auto ring-1 ring-white/10">
                    <pre>{message.chartResult.aiResponse.sql}</pre>
                  </div>
                )}
                <div className="mt-3">
                  <ChartRendererDynamic
                    result={message.chartResult}
                    messageId={message.id}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
