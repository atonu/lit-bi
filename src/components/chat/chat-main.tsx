"use client";

import {
  useEffect,
  useRef,
  useTransition,
  useCallback,
  useState,
} from "react";
import Image from "next/image";
import { Database, ChevronDown, Sparkles, Plus } from "lucide-react";
import { useChatStore, type ChatMessage, type MessageRole, type MessageStatus, type ChartResult } from "@/lib/stores/chat-store";
import { ChatMessageBubble } from "./chat-message";
import { ChatInput } from "./chat-input";
import {
  askQuestion,
  getConnections,
  type ConnectionSummary,
} from "@/app/actions/ai-chat";
import {
  executeQuery,
  checkQueryJobStatus,
  getQueryJobResults,
} from "@/app/actions/execute-query";
import {
  createChatSession,
  updateChatSessionTitle,
  type StoredChatMessage,
} from "@/app/actions/chat-history";
import { useRouter } from "next/navigation";
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
          <span className="hidden sm:inline text-white/30">
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
  hasConnections,
  onAddConnection,
}: {
  connectionAlias: string | null;
  hasConnections: boolean;
  onAddConnection: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 pb-32">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-32 items-center justify-center rounded-3xl overflow-hidden">
          <Image
            src="/bilite-ai.png"
            alt="BI-Lite AI Logo"
            width={128}
            height={128}
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {connectionAlias
              ? `Ask about ${connectionAlias}`
              : "BI-Lite AI Chat"}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-white/40">
            Ask questions in plain English. I'll write the query, run it
            securely, and render the best visualization automatically.
          </p>
          {!hasConnections && (
            <div className="mt-8 flex flex-col items-center">
              <p className="mb-4 text-sm font-medium text-blue-300">
                Unlock the power of AI on your own data.
              </p>
              <button
                onClick={onAddConnection}
                className="flex items-center gap-2 rounded-xl bg-blue-500/80 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-500 hover:scale-105"
              >
                <Plus className="size-4" />
                Connect to a Database
              </button>
            </div>
          )}
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
  chatId?: string;
  initialMessages?: StoredChatMessage[];
}

export function ChatMain({ initialConnections = [], chatId, initialMessages = [] }: ChatMainProps) {
  const router = useRouter();
  const {
    activeConnectionId,
    activeConnectionAlias,
    activeSessionId,
    activeMessages,
    isThinking,
    activeRequestId,
    activeRequestSessionId,
    setActiveRequest,
    cancelActiveRequest,
    sessions,
    setActiveConnection,
    setActiveSession,
    createNewSession,
    promoteSession,
    addUserMessage,
    addAssistantPlaceholder,
    updateMessageStatus,
    resolveMessageWithChart,
    resolveMessageWithError,
    setThinking,
    updateSessionTitle,
    startSyncTimer,
    stopSyncTimer,
    messagesBySession,
  } = useChatStore();

  const [connections, setConnections] =
    useState<ConnectionSummary[]>(initialConnections);
  const [_isPending, startTransition] = useTransition();
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isChatPanelHidden, setIsChatPanelHidden] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isEmpty = activeMessages.length === 0;
  const isCurrentSessionThinking = isThinking && activeRequestSessionId === activeSessionId;

  const handleStop = useCallback(() => {
    cancelActiveRequest(activeSessionId || undefined);
  }, [cancelActiveRequest, activeSessionId]);

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

  // Reset suggestions state based on whether the active session is empty
  useEffect(() => {
    setShowSuggestions(isEmpty);
  }, [activeSessionId, isEmpty]);

  const syncedChatIdRef = useRef<string | undefined>(undefined);

  // Ensure there's an active session when a connection is selected
  useEffect(() => {
    if (chatId) {
      // If we're on a specific chat route, make sure it's set as active
      if (activeSessionId === chatId) {
        syncedChatIdRef.current = chatId;
      } else if (syncedChatIdRef.current !== chatId && !activeSessionId?.startsWith("new-")) {
        setActiveSession(chatId);
        syncedChatIdRef.current = chatId;
      }

      // Also restore the active connection of this session
      const session = sessions.find((s) => s.id === chatId);
      if (session && session.connectionId && activeConnectionId !== session.connectionId) {
        setActiveConnection(session.connectionId, session.connectionAlias || "Deleted DB");
      }

      // Populate messages if provided and not already in store
      if (initialMessages.length > 0 && !messagesBySession[chatId]) {
        const mapped: ChatMessage[] = initialMessages.map((m) => ({
          id: m.id,
          role: m.role.toLowerCase() as MessageRole,
          content: m.content,
          status: (m.role === "ERROR" ? "error" : "done") as MessageStatus,
          timestamp: new Date(m.createdAt).getTime(),
          chartResult: m.chartResult as ChartResult | undefined,
        }));
        useChatStore.getState().setSessionMessages(chatId, mapped);
      }
    } else {
      syncedChatIdRef.current = undefined;

      if (activeConnectionId && activeConnectionAlias && !activeSessionId) {
        // Check if there's an existing session for this connection (fallback for home page)
        const existingSession = sessions.find(
          (s) => s.connectionId === activeConnectionId
        );
        if (existingSession) {
          setActiveSession(existingSession.id);
        } else {
          createNewSession(activeConnectionId, activeConnectionAlias);
        }
      }
    }
  }, [chatId, activeConnectionId, activeConnectionAlias, activeSessionId, sessions, setActiveSession, createNewSession, initialMessages, messagesBySession, setActiveConnection]);

  // Client-side fallback / transition message loading
  useEffect(() => {
    if (activeSessionId && !activeSessionId.startsWith("new-") && !messagesBySession[activeSessionId]) {
      import("@/app/actions/chat-history").then(({ getChatMessages }) => {
        getChatMessages(activeSessionId).then((storedMsgs) => {
          const mapped: ChatMessage[] = storedMsgs.map((m) => ({
            id: m.id,
            role: m.role.toLowerCase() as MessageRole,
            content: m.content,
            status: (m.role === "ERROR" ? "error" : "done") as MessageStatus,
            timestamp: new Date(m.createdAt).getTime(),
            chartResult: m.chartResult as ChartResult | undefined,
          }));
          useChatStore.getState().setSessionMessages(activeSessionId, mapped);
        });
      });
    }
  }, [activeSessionId, messagesBySession]);

  // ── Main chat handler ──────────────────────────────────────────────────

  const handleQuestion = useCallback(
    (question: string) => {
      if (!activeConnectionId || !activeSessionId || isCurrentSessionThinking) return;

      const connectionId = activeConnectionId;
      const sessionId = activeSessionId;
      const isFirstMessage = activeMessages.length === 0;

      // Generate a unique request ID
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setActiveRequest(requestId, sessionId);

      // Optimistically add user message
      addUserMessage(sessionId, question);

      // Add assistant placeholder
      const assistantMsgId = `${Date.now()}-assistant`;
      addAssistantPlaceholder(sessionId, assistantMsgId);
      setThinking(true);

      startTransition(async () => {
        let currentSessionId = sessionId;
        let realSessionId: string | null = null;
        try {
          const derivedTitle = question.slice(0, 20).trim() + (question.length > 20 ? "..." : "");

          if (isFirstMessage && sessionId.startsWith("new-")) {
            // Persist session to DB
            const sessionResult = await createChatSession(connectionId, activeConnectionAlias || "Deleted DB", derivedTitle);
            if (sessionResult.success) {
              realSessionId = sessionResult.sessionId;

              // Promote the session locally so state matches the real DB ID
              promoteSession(sessionId, realSessionId);
              currentSessionId = realSessionId;
              updateSessionTitle(realSessionId, derivedTitle);
            }
          } else {
            // Update title for existing session if it's currently 'New Chat'
            const currentSession = sessions.find((s) => s.id === sessionId);
            if (currentSession && currentSession.title === "New Chat") {
              await updateChatSessionTitle(sessionId, derivedTitle);
              updateSessionTitle(sessionId, derivedTitle);
            }
          }

          // Step 1: AI generates SQL + chart config
          if (useChatStore.getState().activeRequestId !== requestId) return;
          updateMessageStatus(currentSessionId, assistantMsgId, "thinking");
          const aiOutcome = await askQuestion(connectionId, question);

          if (useChatStore.getState().activeRequestId !== requestId) return;

          if (!aiOutcome.success) {
            resolveMessageWithError(currentSessionId, assistantMsgId, aiOutcome.error);
            if (realSessionId) {
              router.push(`/chat/${realSessionId}`);
            }
            return;
          }

          // Step 2: Initiate async query execution on the backend
          updateMessageStatus(currentSessionId, assistantMsgId, "executing");
          const initOutcome = await executeQuery(
            connectionId,
            aiOutcome.response.sql
          );

          if (useChatStore.getState().activeRequestId !== requestId) return;

          if (!initOutcome.success) {
            resolveMessageWithError(currentSessionId, assistantMsgId, initOutcome.error);
            if (realSessionId) {
              router.push(`/chat/${realSessionId}`);
            }
            return;
          }

          const jobId = initOutcome.jobId;

          // Poll job status until complete or failed
          let jobStatus: any = null;
          const pollInterval = 1000; // 1s
          const maxRetries = 120; // 2 minutes limit
          let retries = 0;

          while (retries < maxRetries) {
            if (useChatStore.getState().activeRequestId !== requestId) return;

            const statusRes = await checkQueryJobStatus(jobId);
            if (!statusRes.success) {
              resolveMessageWithError(currentSessionId, assistantMsgId, statusRes.error);
              if (realSessionId) router.push(`/chat/${realSessionId}`);
              return;
            }

            if (statusRes.status === "completed") {
              jobStatus = statusRes;
              break;
            }

            if (statusRes.status === "failed") {
              resolveMessageWithError(currentSessionId, assistantMsgId, statusRes.error || "Query execution failed.");
              if (realSessionId) router.push(`/chat/${realSessionId}`);
              return;
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            retries++;
          }

          if (!jobStatus) {
            resolveMessageWithError(currentSessionId, assistantMsgId, "Query execution timed out.");
            if (realSessionId) router.push(`/chat/${realSessionId}`);
            return;
          }

          // Step 3: Fetch the first page of results
          const resultsRes = await getQueryJobResults(jobId, 1);
          if (!resultsRes.success) {
            resolveMessageWithError(currentSessionId, assistantMsgId, resultsRes.error);
            if (realSessionId) router.push(`/chat/${realSessionId}`);
            return;
          }

          // Step 4: Resolve with chart result
          resolveMessageWithChart(currentSessionId, assistantMsgId, {
            rows: resultsRes.rows,
            columns: jobStatus.columns,
            rowCount: jobStatus.rowCount,
            executionMs: jobStatus.durationMs,
            aiResponse: aiOutcome.response,
            jobId, // Attach jobId for further paging if needed
          });

          // Redirect to the new parameterized route AFTER everything has completed successfully!
          if (realSessionId) {
            router.push(`/chat/${realSessionId}`);
          }
        } catch (err) {
          if (useChatStore.getState().activeRequestId !== requestId) return;
          const msg = err instanceof Error ? err.message : String(err);
          resolveMessageWithError(currentSessionId, assistantMsgId, msg);

          if (realSessionId) {
            router.push(`/chat/${realSessionId}`);
          }
        }
      });
    },
    [
      activeConnectionId,
      activeSessionId,
      activeMessages.length,
      isCurrentSessionThinking,
      addUserMessage,
      addAssistantPlaceholder,
      updateMessageStatus,
      resolveMessageWithChart,
      resolveMessageWithError,
      setThinking,
      updateSessionTitle,
      promoteSession,
      setActiveRequest,
      activeConnectionAlias,
      router,
    ]
  );

  return (
    <div className="relative flex h-full flex-col bg-[#131314]">
      {/* Messages area */}
      <div className={cn(
        "flex-1 overflow-y-auto",
        isChatPanelHidden 
          ? "pb-16" 
          : showSuggestions 
            ? "pb-[380px] md:pb-8" 
            : "pb-[180px] md:pb-8"
      )}>
        {isEmpty ? (
          <WelcomeScreen
            connectionAlias={activeConnectionAlias}
            hasConnections={connections.length > 0}
            onAddConnection={() => setShowAddConnection(true)}
          />
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

      {/* Bottom input area — absolute/fixed on mobile, normal relative on desktop */}
      <div className={cn(
        "shrink-0 border-t border-white/[0.06] bg-[#131314] px-4 py-4",
        "fixed bottom-0 left-0 right-0 z-30 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:border-t md:bg-[#131314] md:p-4",
        isChatPanelHidden && "hidden md:block"
      )}>
        <div className="mx-auto max-w-3xl">
          {/* Connection selector row */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ConnectionSelector
                connections={connections}
                activeId={activeConnectionId}
                onSelect={(conn) => {
                  setActiveConnection(conn.id, conn.alias);
                  createNewSession(conn.id, conn.alias);
                }}
                onAddNew={() => setShowAddConnection(true)}
              />
              {activeConnectionId && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions((s) => !s)}
                  className="text-xs text-white/40 underline hover:text-white/80 transition-colors ml-2 cursor-pointer"
                >
                  {showSuggestions ? "Hide Suggestions" : "Suggestions"}
                </button>
              )}
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

            {/* Down arrow to minimize panel on mobile */}
            <button
              type="button"
              onClick={() => setIsChatPanelHidden(true)}
              className="flex size-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white md:hidden cursor-pointer"
              title="Minimize chat panel"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>

          {/* Chat input */}
          <ChatInput
            onSubmit={handleQuestion}
            disabled={!activeConnectionId || isCurrentSessionThinking}
            isThinking={isCurrentSessionThinking}
            onStop={handleStop}
            showSuggestions={showSuggestions}
          />

          <p className="mt-2 text-center text-[10px] text-white/20 hidden md:block">
            BI-Lite can make mistakes. Verify important data.
          </p>
        </div>
      </div>

      {/* Floating Button to restore Chat Panel */}
      {isChatPanelHidden && (
        <button
          onClick={() => setIsChatPanelHidden(false)}
          className="fixed bottom-6 right-6 z-40 flex size-[68px] items-center justify-center rounded-full shadow-2xl md:hidden cursor-pointer hover:scale-105 active:scale-95 transition-all bg-transparent border-none"
          title="Restore chat panel"
        >
          <div className="size-[68px] rounded-full overflow-hidden">
            <Image
              src="/bilite-ai.png"
              alt="Restore Panel"
              width={68}
              height={68}
              className="object-cover"
            />
          </div>
        </button>
      )}

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
