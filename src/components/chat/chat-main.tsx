"use client";

import {
  useEffect,
  useRef,
  useTransition,
  useCallback,
  useState,
} from "react";
import { Database, ChevronDown, Sparkles, Plus } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat-store";
import { ChatMessageBubble } from "./chat-message";
import { ChatInput } from "./chat-input";
import {
  askQuestion,
  getConnections,
  generateChatTitle,
  type ConnectionSummary,
} from "@/app/actions/ai-chat";
import { executeQuery } from "@/app/actions/execute-query";
import {
  createChatSession,
  updateChatSessionTitle,
} from "@/app/actions/chat-history";
import { cn } from "@/lib/utils";
import { ConnectionStepper } from "@/components/connection/connection-stepper";

// ---------------------------------------------------------------------------
// Connection selector pill
// ---------------------------------------------------------------------------

interface ConnectionSelectorProps {
  connections: ConnectionSummary[];
  activeId: string | null;
  onSelect: (conn: ConnectionSummary) => void;
  onAddNew: () => void;
}

function ConnectionSelector({
  connections,
  activeId,
  onSelect,
  onAddNew,
}: ConnectionSelectorProps) {
  const [open, setOpen] = useState(false);
  const active = connections.find((c) => c.id === activeId);

  return (
    <div className="relative">
      <button
        id="connection-selector"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white/90"
      >
        <Database className="size-3.5 shrink-0 text-blue-400" />
        <span className="max-w-[160px] truncate">
          {active ? active.alias : "No database selected"}
        </span>
        {active && (
          <span className="text-white/30">
            · {active.dbName ?? active.host}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3 shrink-0 text-white/40 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl shadow-black/60">
            {connections.length === 0 ? (
              <div className="px-4 py-3 text-xs text-white/40">
                No connected databases
              </div>
            ) : (
              connections.map((conn) => (
                <button
                  key={conn.id}
                  onClick={() => {
                    onSelect(conn);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/[0.06]",
                    conn.id === activeId && "bg-blue-500/10 text-blue-300"
                  )}
                >
                  <Database className="size-4 shrink-0 text-blue-400/70" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white/90">{conn.alias}</p>
                    <p className="truncate text-xs text-white/30">
                      {conn.engine.toLowerCase()} · {conn.dbName ?? conn.host}
                    </p>
                  </div>
                  {conn.id === activeId && (
                    <span className="size-2 rounded-full bg-blue-400" />
                  )}
                </button>
              ))
            )}
            <div className="border-t border-white/[0.06] p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  onAddNew();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80"
              >
                <Plus className="size-3.5" />
                Add new connection
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome screen (shown when no messages)
// ---------------------------------------------------------------------------

function WelcomeScreen({
  connectionAlias,
}: {
  connectionAlias: string | null;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 pb-32">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 ring-1 ring-white/10">
          <Sparkles className="size-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {connectionAlias
              ? `Ask about ${connectionAlias}`
              : "LiteBI AI Chat"}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-white/40">
            Ask questions in plain English. I'll write the query, run it
            securely, and render the best visualization automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatMain — Gemini-style centered chat
// ---------------------------------------------------------------------------

interface ChatMainProps {
  initialConnections?: ConnectionSummary[];
}

export function ChatMain({ initialConnections = [] }: ChatMainProps) {
  const {
    activeConnectionId,
    activeConnectionAlias,
    activeSessionId,
    activeMessages,
    isThinking,
    sessions,
    setActiveConnection,
    setActiveSession,
    createNewSession,
    addUserMessage,
    addAssistantPlaceholder,
    updateMessageStatus,
    resolveMessageWithChart,
    resolveMessageWithError,
    setThinking,
    updateSessionTitle,
    startSyncTimer,
    stopSyncTimer,
  } = useChatStore();

  const [connections, setConnections] =
    useState<ConnectionSummary[]>(initialConnections);
  const [_isPending, startTransition] = useTransition();
  const [showAddConnection, setShowAddConnection] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isEmpty = activeMessages.length === 0;

  // Load connections on mount
  useEffect(() => {
    if (initialConnections.length > 0) {
      setConnections(initialConnections);
      // Auto-select first connection if none active
      if (!activeConnectionId && initialConnections.length > 0) {
        const first = initialConnections[0];
        setActiveConnection(first.id, first.alias);
      }
    } else {
      getConnections().then((conns) => {
        setConnections(conns);
        if (!activeConnectionId && conns.length > 0) {
          setActiveConnection(conns[0].id, conns[0].alias);
        }
      });
    }
  }, []);

  // Start sync timer on mount, stop on unmount
  useEffect(() => {
    startSyncTimer();
    return () => stopSyncTimer();
  }, [startSyncTimer, stopSyncTimer]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // Ensure there's an active session when a connection is selected
  useEffect(() => {
    if (activeConnectionId && activeConnectionAlias && !activeSessionId) {
      // Check if there's an existing session for this connection
      const existingSession = sessions.find(
        (s) => s.connectionId === activeConnectionId
      );
      if (existingSession) {
        setActiveSession(existingSession.id);
      } else {
        createNewSession(activeConnectionId, activeConnectionAlias);
      }
    }
  }, [activeConnectionId, activeConnectionAlias, activeSessionId]);

  // ── Main chat handler ──────────────────────────────────────────────────

  const handleQuestion = useCallback(
    (question: string) => {
      if (!activeConnectionId || !activeSessionId || isThinking) return;

      const connectionId = activeConnectionId;
      const sessionId = activeSessionId;
      const isFirstMessage = activeMessages.length === 0;

      // Optimistically add user message
      addUserMessage(sessionId, question);

      // Add assistant placeholder
      const assistantMsgId = `${Date.now()}-assistant`;
      addAssistantPlaceholder(sessionId, assistantMsgId);
      setThinking(true);

      startTransition(async () => {
        try {
          // If first message, create a real DB session and generate a title
          if (isFirstMessage && sessionId.startsWith("new-")) {
            // Persist session to DB
            const sessionResult = await createChatSession(connectionId);
            if (sessionResult.success) {
              // Update store with real session id (best effort — we continue with temp id)
              // Title will be generated and applied async
              generateChatTitle(question).then((title) => {
                updateChatSessionTitle(sessionResult.sessionId, title);
                updateSessionTitle(sessionId, title);
              });
            }
          }

          // Step 1: AI generates SQL + chart config
          updateMessageStatus(sessionId, assistantMsgId, "thinking");
          const aiOutcome = await askQuestion(connectionId, question);

          if (!aiOutcome.success) {
            resolveMessageWithError(sessionId, assistantMsgId, aiOutcome.error);
            return;
          }

          // Step 2: Execute the query on the user's DB
          updateMessageStatus(sessionId, assistantMsgId, "executing");
          const execOutcome = await executeQuery(
            connectionId,
            aiOutcome.response.sql
          );

          if (!execOutcome.success) {
            resolveMessageWithError(sessionId, assistantMsgId, execOutcome.error);
            return;
          }

          // Step 3: Resolve with chart result
          resolveMessageWithChart(sessionId, assistantMsgId, {
            rows: execOutcome.rows,
            columns: execOutcome.columns,
            rowCount: execOutcome.rowCount,
            executionMs: execOutcome.executionMs,
            aiResponse: aiOutcome.response,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          resolveMessageWithError(sessionId, assistantMsgId, msg);
        }
      });
    },
    [
      activeConnectionId,
      activeSessionId,
      activeMessages.length,
      isThinking,
      addUserMessage,
      addAssistantPlaceholder,
      updateMessageStatus,
      resolveMessageWithChart,
      resolveMessageWithError,
      setThinking,
      updateSessionTitle,
    ]
  );

  return (
    <div className="relative flex h-full flex-col bg-[#131314]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <WelcomeScreen connectionAlias={activeConnectionAlias} />
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="flex flex-col gap-6">
              {activeMessages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom input area — fixed to bottom of container */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#131314] px-4 py-4">
        <div className="mx-auto max-w-3xl">
          {/* Connection selector row */}
          <div className="mb-3 flex items-center gap-2">
            <ConnectionSelector
              connections={connections}
              activeId={activeConnectionId}
              onSelect={(conn) => {
                setActiveConnection(conn.id, conn.alias);
                createNewSession(conn.id, conn.alias);
              }}
              onAddNew={() => setShowAddConnection(true)}
            />
            {!activeConnectionId && connections.length === 0 && (
              <button
                onClick={() => setShowAddConnection(true)}
                className="flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/30"
              >
                <Plus className="size-3.5" />
                Connect a database
              </button>
            )}
          </div>

          {/* Chat input */}
          <ChatInput
            onSubmit={handleQuestion}
            disabled={!activeConnectionId || isThinking}
            isEmpty={isEmpty}
          />

          <p className="mt-2 text-center text-[10px] text-white/20">
            LiteBI can make mistakes. Verify important data.
          </p>
        </div>
      </div>

      {/* Add connection modal */}
      {showAddConnection && (
        <ConnectionStepper
          onClose={() => setShowAddConnection(false)}
          onSuccess={() => {
            setShowAddConnection(false);
            // Reload connections
            getConnections().then((conns) => {
              setConnections(conns);
              if (conns.length > 0) {
                const newest = conns[0];
                setActiveConnection(newest.id, newest.alias);
              }
            });
          }}
        />
      )}
    </div>
  );
}
