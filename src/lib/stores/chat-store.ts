import { create } from "zustand";
import type { AiQueryResponse } from "@/app/actions/ai-chat";
import type { QueryRow } from "@/app/actions/execute-query";

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

  // Messages per connection (keyed by connectionId)
  messagesByConnection: Record<string, ChatMessage[]>;

  // UI state
  isChatOpen: boolean;
  isThinking: boolean;

  // Derived: messages for the active connection
  activeMessages: ChatMessage[];
}

interface ChatActions {
  setActiveConnection: (id: string, alias: string) => void;
  clearActiveConnection: () => void;
  addUserMessage: (connectionId: string, content: string) => string;
  addAssistantPlaceholder: (connectionId: string, messageId: string) => void;
  updateMessageStatus: (
    connectionId: string,
    messageId: string,
    status: MessageStatus
  ) => void;
  resolveMessageWithChart: (
    connectionId: string,
    messageId: string,
    chartResult: ChartResult
  ) => void;
  resolveMessageWithError: (
    connectionId: string,
    messageId: string,
    errorText: string
  ) => void;
  setChatOpen: (open: boolean) => void;
  setThinking: (thinking: boolean) => void;
  clearHistory: (connectionId: string) => void;
}

type ChatStore = ChatState & ChatActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getMessages(
  state: ChatState,
  connectionId: string
): ChatMessage[] {
  return state.messagesByConnection[connectionId] ?? [];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────
  activeConnectionId: null,
  activeConnectionAlias: null,
  messagesByConnection: {},
  isChatOpen: false,
  isThinking: false,
  activeMessages: [],

  // ── Actions ────────────────────────────────────────────────────────────

  setActiveConnection: (id, alias) => {
    const messages = get().messagesByConnection[id] ?? [];
    set({
      activeConnectionId: id,
      activeConnectionAlias: alias,
      activeMessages: messages,
      isChatOpen: true,
    });
  },

  clearActiveConnection: () => {
    set({
      activeConnectionId: null,
      activeConnectionAlias: null,
      activeMessages: [],
      isChatOpen: false,
    });
  },

  addUserMessage: (connectionId, content) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: "user",
      content,
      status: "done",
      timestamp: Date.now(),
    };
    set((state) => {
      const prev = getMessages(state, connectionId);
      const updated = [...prev, message];
      return {
        messagesByConnection: {
          ...state.messagesByConnection,
          [connectionId]: updated,
        },
        activeMessages:
          state.activeConnectionId === connectionId ? updated : state.activeMessages,
      };
    });
    return id;
  },

  addAssistantPlaceholder: (connectionId, messageId) => {
    const message: ChatMessage = {
      id: messageId,
      role: "assistant",
      content: "",
      status: "thinking",
      timestamp: Date.now(),
    };
    set((state) => {
      const prev = getMessages(state, connectionId);
      const updated = [...prev, message];
      return {
        messagesByConnection: {
          ...state.messagesByConnection,
          [connectionId]: updated,
        },
        activeMessages:
          state.activeConnectionId === connectionId ? updated : state.activeMessages,
      };
    });
  },

  updateMessageStatus: (connectionId, messageId, status) => {
    set((state) => {
      const prev = getMessages(state, connectionId);
      const updated = prev.map((m) =>
        m.id === messageId ? { ...m, status } : m
      );
      return {
        messagesByConnection: {
          ...state.messagesByConnection,
          [connectionId]: updated,
        },
        activeMessages:
          state.activeConnectionId === connectionId ? updated : state.activeMessages,
      };
    });
  },

  resolveMessageWithChart: (connectionId, messageId, chartResult) => {
    const content = chartResult.aiResponse.reasoning;
    set((state) => {
      const prev = getMessages(state, connectionId);
      const updated = prev.map((m) =>
        m.id === messageId
          ? { ...m, content, status: "done" as MessageStatus, chartResult }
          : m
      );
      return {
        messagesByConnection: {
          ...state.messagesByConnection,
          [connectionId]: updated,
        },
        activeMessages:
          state.activeConnectionId === connectionId ? updated : state.activeMessages,
        isThinking: false,
      };
    });
  },

  resolveMessageWithError: (connectionId, messageId, errorText) => {
    set((state) => {
      const prev = getMessages(state, connectionId);
      const updated = prev.map((m) =>
        m.id === messageId
          ? { ...m, content: errorText, status: "error" as MessageStatus, role: "error" as MessageRole }
          : m
      );
      return {
        messagesByConnection: {
          ...state.messagesByConnection,
          [connectionId]: updated,
        },
        activeMessages:
          state.activeConnectionId === connectionId ? updated : state.activeMessages,
        isThinking: false,
      };
    });
  },

  setChatOpen: (open) => set({ isChatOpen: open }),

  setThinking: (thinking) => set({ isThinking: thinking }),

  clearHistory: (connectionId) => {
    set((state) => {
      const { [connectionId]: _removed, ...rest } = state.messagesByConnection;
      return {
        messagesByConnection: rest,
        activeMessages:
          state.activeConnectionId === connectionId ? [] : state.activeMessages,
      };
    });
  },
}));
