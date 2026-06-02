"use client";

import { cn } from "@/lib/utils";
import { Sparkles, User, AlertCircle, Loader2 } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/stores/chat-store";
import { ChartRenderer } from "./chart-renderer";
import dynamic from "next/dynamic";

// ChartRenderer uses Recharts which requires browser-only APIs
const ChartRendererDynamic = dynamic(
  () => import("./chart-renderer").then((m) => m.ChartRenderer),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Thinking indicator — animated dots
// ---------------------------------------------------------------------------

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="size-3 animate-spin text-chart-1" />
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatMessage
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isError = message.role === "error";
  const isThinking = message.status === "thinking";
  const isExecuting = message.status === "executing";

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-chart-1/80 to-chart-5/80 px-4 py-2.5 text-sm text-white shadow-sm">
          {message.content}
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="size-3.5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-3.5 text-destructive" />
        </div>
        <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-destructive/10 px-4 py-2.5 text-sm text-destructive-foreground ring-1 ring-destructive/20">
          <p className="font-medium text-destructive">Something went wrong</p>
          <p className="mt-1 text-xs text-muted-foreground">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message (thinking / executing / done)
  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full ring-1",
          isThinking || isExecuting
            ? "bg-chart-1/10 ring-chart-1/30"
            : "bg-gradient-to-br from-chart-1/20 to-chart-5/20 ring-chart-1/20"
        )}
      >
        <Sparkles
          className={cn(
            "size-3.5",
            isThinking || isExecuting
              ? "animate-pulse text-chart-1"
              : "text-chart-1"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        {isThinking && <ThinkingIndicator label="Analyzing schema and writing SQL…" />}
        {isExecuting && <ThinkingIndicator label="Executing query on your database…" />}

        {message.status === "done" && (
          <>
            {message.content && (
              <p className="text-sm leading-relaxed text-foreground/90">
                {message.content}
              </p>
            )}
            {message.chartResult && (
              <ChartRendererDynamic
                result={message.chartResult}
                messageId={message.id}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
