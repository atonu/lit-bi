import { create } from "zustand";
import type { AiQueryResponse } from "@/app/actions/ai-chat";
import type { QueryRow } from "@/app/actions/execute-query";
import type { ChatSessionSummary } from "@/app/actions/chat-history";
import { CHAT_SYNC_INTERVAL_MS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageRole = "user" | "assistant" | "error";

export type MessageStatus = "pending" | "thinking" | "executing" | "done" | "error";

export interface ChartResult {
  rows: QueryRow[];
  columns: string[];
  rowCount: number;
  executionMs: number;
  aiResponse: AiQueryResponse;
  jobId?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  timestamp: number;
  chartResult?: ChartResult;
}

interface ChatState {
  // Active connection
  activeConnectionId: string | null;
  activeConnectionAlias: string | null;

  // Active session
  activeSessionId: string | null;

  // Messages per session (keyed by sessionId)
  messagesBySession: Record<string, ChatMessage[]>;

  // Chat sessions list (for sidebar)
  sessions: ChatSessionSummary[];
  sessionsLoaded: boolean;

  // Search
  searchQuery: string;

  // UI state
  isThinking: boolean;
  activeRequestId: string | null;
  activeRequestSessionId: string | null;

  // Derived: messages for the active session
  activeMessages: ChatMessage[];

  // Sync tracking
  lastSyncedAt: Record<string, number>; // sessionId → timestamp
  syncTimerId: ReturnType<typeof setInterval> | null;
}

interface ChatActions {
  // Connection management
  setActiveConnection: (id: string, alias: string) => void;
  clearActiveConnection: () => void;

  // Session management
  setActiveSession: (sessionId: string) => void;
  createNewSession: (connectionId: string, alias: string) => void;
  setSessions: (sessions: ChatSessionSummary[]) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  removeSession: (sessionId: string) => void;
  setSessionMessages: (sessionId: string, messages: ChatMessage[]) => void;
  promoteSession: (oldId: string, newId: string) => void;

  // Message management
  addUserMessage: (sessionId: string, content: string) => string;
  addAssistantPlaceholder: (sessionId: string, messageId: string) => void;
  updateMessageStatus: (sessionId: string, messageId: string, status: MessageStatus) => void;
  resolveMessageWithChart: (sessionId: string, messageId: string, chartResult: ChartResult) => void;
  resolveMessageWithError: (sessionId: string, messageId: string, errorText: string) => void;

  // Search
  setSearchQuery: (query: string) => void;

  // UI
  setThinking: (thinking: boolean) => void;
  setActiveRequest: (requestId: string | null, sessionId: string | null) => void;
  cancelActiveRequest: (sessionId?: string) => void;
  clearHistory: (sessionId: string) => void;

  // Sync
  startSyncTimer: () => void;
  stopSyncTimer: () => void;
  markSynced: (sessionId: string) => void;
  getUnsyncedSessionIds: () => string[];
}

type ChatStore = ChatState & ChatActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getMessages(state: ChatState, sessionId: string): ChatMessage[] {
  return state.messagesBySession[sessionId] ?? [];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────
  activeConnectionId: null,
  activeConnectionAlias: null,
  activeSessionId: null,
  messagesBySession: {},
  sessions: [],
  sessionsLoaded: false,
  searchQuery: "",
  isThinking: false,
  activeRequestId: null,
  activeRequestSessionId: null,
  activeMessages: [],
  lastSyncedAt: {},
  syncTimerId: null,

  // ── Connection ─────────────────────────────────────────────────────────

  setActiveConnection: (id, alias) => {
    set({
      activeConnectionId: id,
      activeConnectionAlias: alias,
    });
  },

  clearActiveConnection: () => {
    set({
      activeConnectionId: null,
      activeConnectionAlias: null,
      activeSessionId: null,
      activeMessages: [],
    });
  },

  // ── Session management ─────────────────────────────────────────────────

  setActiveSession: (sessionId) => {
    const messages = get().messagesBySession[sessionId] ?? [];
    set({
      activeSessionId: sessionId,
      activeMessages: messages,
    });
  },

  createNewSession: (connectionId, alias) => {
    const tempId = `new-${generateId()}`;
    const newSession: ChatSessionSummary = {
      id: tempId,
      title: "New Chat",
      connectionId,
      connectionAlias: alias,
      updatedAt: new Date(),
      createdAt: new Date(),
      messageCount: 0,
    };
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      activeSessionId: tempId,
      activeConnectionId: connectionId,
      activeConnectionAlias: alias,
      activeMessages: [],
      messagesBySession: {
        ...state.messagesBySession,
        [tempId]: [],
      },
    }));
  },

  setSessions: (sessions) => {
    set({ sessions, sessionsLoaded: true });
  },

  updateSessionTitle: (sessionId, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      ),
    }));
  },

  removeSession: (sessionId) => {
    if (get().activeRequestSessionId === sessionId) {
      get().cancelActiveRequest(sessionId);
    }
    set((state) => {
      const { [sessionId]: _removed, ...rest } = state.messagesBySession;
      const sessions = state.sessions.filter((s) => s.id !== sessionId);
      return {
        sessions,
        messagesBySession: rest,
        activeSessionId:
          state.activeSessionId === sessionId
            ? (sessions[0]?.id ?? null)
            : state.activeSessionId,
        activeMessages:
          state.activeSessionId === sessionId ? [] : state.activeMessages,
      };
    });
  },

  setSessionMessages: (sessionId, messages) => {
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: messages,
      },
      activeMessages:
        state.activeSessionId === sessionId ? messages : state.activeMessages,
    }));
  },

  promoteSession: (oldId, newId) => {
    set((state) => {
      const messages = state.messagesBySession[oldId] || [];
      const sessionIndex = state.sessions.findIndex((s) => s.id === oldId);
      
      const newSessions = [...state.sessions];
      if (sessionIndex !== -1) {
        newSessions[sessionIndex] = { ...newSessions[sessionIndex], id: newId };
      }

      const newMessagesBySession = { ...state.messagesBySession };
      delete newMessagesBySession[oldId];
      newMessagesBySession[newId] = messages;

      const newLastSyncedAt = { ...state.lastSyncedAt };
      if (oldId in newLastSyncedAt) {
        newLastSyncedAt[newId] = newLastSyncedAt[oldId];
        delete newLastSyncedAt[oldId];
      }

      return {
        sessions: newSessions,
        messagesBySession: newMessagesBySession,
        lastSyncedAt: newLastSyncedAt,
        activeSessionId: state.activeSessionId === oldId ? newId : state.activeSessionId,
        activeRequestSessionId: state.activeRequestSessionId === oldId ? newId : state.activeRequestSessionId,
      };
    });
  },

  // ── Messages ──────────────────────────────────────────────────────────

  addUserMessage: (sessionId, content) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: "user",
      content,
      status: "done",
      timestamp: Date.now(),
    };
    set((state) => {
      const prev = getMessages(state, sessionId);
      const updated = [...prev, message];
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: updated,
        },
        activeMessages:
          state.activeSessionId === sessionId ? updated : state.activeMessages,
      };
    });
    return id;
  },

  addAssistantPlaceholder: (sessionId, messageId) => {
    const message: ChatMessage = {
      id: messageId,
      role: "assistant",
      content: "",
      status: "thinking",
      timestamp: Date.now(),
    };
    set((state) => {
      const prev = getMessages(state, sessionId);
      const updated = [...prev, message];
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: updated,
        },
        activeMessages:
          state.activeSessionId === sessionId ? updated : state.activeMessages,
      };
    });
  },

  updateMessageStatus: (sessionId, messageId, status) => {
    set((state) => {
      const prev = getMessages(state, sessionId);
      const updated = prev.map((m) =>
        m.id === messageId ? { ...m, status } : m
      );
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: updated,
        },
        activeMessages:
          state.activeSessionId === sessionId ? updated : state.activeMessages,
      };
    });
  },

  resolveMessageWithChart: (sessionId, messageId, chartResult) => {
    const content = chartResult.aiResponse.reasoning;
    set((state) => {
      const prev = getMessages(state, sessionId);
      const updated = prev.map((m) =>
        m.id === messageId
          ? { ...m, content, status: "done" as MessageStatus, chartResult }
          : m
      );
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: updated,
        },
        activeMessages:
          state.activeSessionId === sessionId ? updated : state.activeMessages,
        isThinking: false,
      };
    });
  },

  resolveMessageWithError: (sessionId, messageId, errorText) => {
    set((state) => {
      const prev = getMessages(state, sessionId);
      const updated = prev.map((m) =>
        m.id === messageId
          ? { ...m, content: errorText, status: "error" as MessageStatus, role: "error" as MessageRole }
          : m
      );
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: updated,
        },
        activeMessages:
          state.activeSessionId === sessionId ? updated : state.activeMessages,
        isThinking: false,
      };
    });
  },

  // ── Search ─────────────────────────────────────────────────────────────

  setSearchQuery: (query) => set({ searchQuery: query }),

  // ── UI ─────────────────────────────────────────────────────────────────

  setThinking: (thinking) => set({ isThinking: thinking }),

  setActiveRequest: (requestId, sessionId) => {
    set({ activeRequestId: requestId, activeRequestSessionId: sessionId });
  },

  cancelActiveRequest: (sessionId) => {
    const targetSessionId = sessionId || get().activeSessionId;
    if (!targetSessionId) return;

    set((state) => {
      const prev = state.messagesBySession[targetSessionId] ?? [];
      const updated = prev.map((m) => {
        if (
          m.role === "assistant" &&
          (m.status === "thinking" || m.status === "executing" || m.status === "pending")
        ) {
          return {
            ...m,
            role: "error" as MessageRole,
            status: "error" as MessageStatus,
            content: "Request cancelled by user.",
          };
        }
        return m;
      });

      return {
        activeRequestId: null,
        activeRequestSessionId: null,
        isThinking: false,
        messagesBySession: {
          ...state.messagesBySession,
          [targetSessionId]: updated,
        },
        activeMessages:
          state.activeSessionId === targetSessionId ? updated : state.activeMessages,
      };
    });
  },

  clearHistory: (sessionId) => {
    set((state) => {
      const { [sessionId]: _removed, ...rest } = state.messagesBySession;
      return {
        messagesBySession: rest,
        activeMessages:
          state.activeSessionId === sessionId ? [] : state.activeMessages,
      };
    });
  },

  // ── Sync ───────────────────────────────────────────────────────────────

  startSyncTimer: () => {
    const existing = get().syncTimerId;
    if (existing) return; // already running

    const timerId = setInterval(async () => {
      const { getUnsyncedSessionIds, messagesBySession, markSynced } = get();
      const sessionIds = getUnsyncedSessionIds();
      if (sessionIds.length === 0) return;

      const { saveChatMessages } = await import("@/app/actions/chat-history");
      for (const sessionId of sessionIds) {
        const messages = messagesBySession[sessionId] ?? [];
        const doneMsgs = messages.filter((m) => m.status === "done" || m.status === "error");
        if (doneMsgs.length === 0) continue;
        await saveChatMessages(
          sessionId,
          doneMsgs.map((m) => ({
            id: m.id,
            role: m.role.toUpperCase() as "USER" | "ASSISTANT" | "ERROR",
            content: m.content,
            chartResult: m.chartResult,
          }))
        );
        markSynced(sessionId);
      }
    }, CHAT_SYNC_INTERVAL_MS);

    set({ syncTimerId: timerId });
  },

  stopSyncTimer: () => {
    const { syncTimerId } = get();
    if (syncTimerId) {
      clearInterval(syncTimerId);
      set({ syncTimerId: null });
    }
  },

  markSynced: (sessionId) => {
    set((state) => ({
      lastSyncedAt: { ...state.lastSyncedAt, [sessionId]: Date.now() },
    }));
  },

  getUnsyncedSessionIds: () => {
    const { messagesBySession, lastSyncedAt } = get();
    return Object.keys(messagesBySession).filter((id) => {
      const msgs = messagesBySession[id];
      if (!msgs || msgs.length === 0) return false;
      const lastMsg = msgs[msgs.length - 1];
      const lastSync = lastSyncedAt[id] ?? 0;
      return lastMsg.timestamp > lastSync;
    });
  },
}));
