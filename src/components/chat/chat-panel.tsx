"use client";

import {
  useEffect,
  useRef,
  useTransition,
  useCallback,
  useState,
} from "react";
import { X, Trash2, Database, ChevronDown } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";
import { ChatMessageBubble } from "./chat-message";
import { ChatInput } from "./chat-input";
import { askQuestion, getConnections, type ConnectionSummary } from "@/app/actions/ai-chat";
import { executeQuery } from "@/app/actions/execute-query";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Connection selector dropdown
// ---------------------------------------------------------------------------

interface ConnectionSelectorProps {
  connections: ConnectionSummary[];
  activeId: string | null;
  onSelect: (conn: ConnectionSummary) => void;
}

function ConnectionSelector({
  connections,
  activeId,
  onSelect,
}: ConnectionSelectorProps) {
  const [open, setOpen] = useState(false);
  const active = connections.find((c) => c.id === activeId);

  if (connections.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <Database className="size-3.5" />
        No connected databases found
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs transition-all hover:border-chart-1/30 hover:bg-chart-1/5"
      >
        <Database className="size-3.5 text-chart-1" />
        <span className="flex-1 truncate text-left text-foreground">
          {active ? active.alias : "Select a database…"}
        </span>
        {active && (
          <span className="text-muted-foreground">
            {active.host}/{active.dbName}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          {/* Click-outside overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border/50 bg-popover shadow-xl shadow-black/20">
            {connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => {
                  onSelect(conn);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-xs transition-all hover:bg-muted/40",
                  conn.id === activeId && "bg-chart-1/10 text-chart-1"
                )}
              >
                <Database className="size-3.5 shrink-0" />
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">{conn.alias}</span>
                  <span className="text-muted-foreground">
                    {conn.engine.toLowerCase()} · {conn.host}/{conn.dbName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

export function ChatPanel() {
  const {
    activeConnectionId,
    activeConnectionAlias,
    activeMessages,
    isChatOpen,
    isThinking,
    setActiveConnection,
    clearActiveConnection,
    addUserMessage,
    addAssistantPlaceholder,
    updateMessageStatus,
    resolveMessageWithChart,
    resolveMessageWithError,
    setThinking,
    clearHistory,
  } = useChatStore();

  const [connections, setConnections] = useState<ConnectionSummary[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [_isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load connections when panel opens
  useEffect(() => {
    if (!isChatOpen) return;
    setIsLoadingConnections(true);
    getConnections().then((conns) => {
      setConnections(conns);
      setIsLoadingConnections(false);
      // Auto-select first if none active
      if (!activeConnectionId && conns.length > 0) {
        setActiveConnection(conns[0].id, conns[0].alias);
      }
    });
  }, [isChatOpen]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // ── Main chat handler ──────────────────────────────────────────────────

  const handleQuestion = useCallback(
    (question: string) => {
      if (!activeConnectionId || isThinking) return;

      const connectionId = activeConnectionId;

      // Optimistically add user message
      addUserMessage(connectionId, question);

      // Add assistant placeholder with a unique ID
      const assistantMsgId = `${Date.now()}-assistant`;
      addAssistantPlaceholder(connectionId, assistantMsgId);
      setThinking(true);

      startTransition(async () => {
        try {
          // Step 1: AI generates SQL + chart config
          updateMessageStatus(connectionId, assistantMsgId, "thinking");
          const aiOutcome = await askQuestion(connectionId, question);

          if (!aiOutcome.success) {
            resolveMessageWithError(connectionId, assistantMsgId, aiOutcome.error);
            return;
          }

          // Step 2: Execute the SQL on the user's DB
          updateMessageStatus(connectionId, assistantMsgId, "executing");
          const execOutcome = await executeQuery(
            connectionId,
            aiOutcome.response.sql
          );

          if (!execOutcome.success) {
            resolveMessageWithError(
              connectionId,
              assistantMsgId,
              execOutcome.error
            );
            return;
          }

          // Step 3: Resolve with chart result
          resolveMessageWithChart(connectionId, assistantMsgId, {
            rows: execOutcome.rows,
            columns: execOutcome.columns,
            rowCount: execOutcome.rowCount,
            executionMs: execOutcome.executionMs,
            aiResponse: aiOutcome.response,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          resolveMessageWithError(connectionId, assistantMsgId, msg);
        }
      });
    },
    [
      activeConnectionId,
      isThinking,
      addUserMessage,
      addAssistantPlaceholder,
      updateMessageStatus,
      resolveMessageWithChart,
      resolveMessageWithError,
      setThinking,
    ]
  );

  if (!isChatOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={() => clearActiveConnection()}
      />

      {/* Slide-in panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-border/50 bg-background/95 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-chart-1/20 to-chart-5/20">
              <span className="text-[10px]">✨</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                AI Data Agent
              </span>
              {activeConnectionAlias && (
                <span className="text-[10px] text-muted-foreground">
                  Connected to {activeConnectionAlias}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {activeConnectionId && activeMessages.length > 0 && (
              <button
                onClick={() => {
                  if (activeConnectionId) clearHistory(activeConnectionId);
                }}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                title="Clear chat history"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
            <button
              onClick={() => clearActiveConnection()}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              title="Close chat"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Connection selector */}
        <div className="shrink-0 border-b border-border/40 px-4 py-3">
          {isLoadingConnections ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-chart-1" />
              Loading connections…
            </div>
          ) : (
            <ConnectionSelector
              connections={connections}
              activeId={activeConnectionId}
              onSelect={(conn) => setActiveConnection(conn.id, conn.alias)}
            />
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-1/10 to-chart-5/10 ring-1 ring-chart-1/20">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Ask anything about your data
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  I'll write the SQL, run it securely, and render the best
                  chart for you — automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {activeMessages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-border/40 px-4 py-3">
          <ChatInput
            onSubmit={handleQuestion}
            disabled={!activeConnectionId || isThinking}
            isEmpty={activeMessages.length === 0}
          />
        </div>
      </aside>
    </>
  );
}
