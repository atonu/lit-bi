"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";
import jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatSessionSummary {
  id: string;
  title: string;
  connectionId: string | null;
  connectionAlias: string | null;
  updatedAt: Date;
  createdAt: Date;
  messageCount?: number;
}

export interface StoredChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "ERROR";
  content: string;
  chartResult?: unknown;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Helper: Sign a short-lived token for backend authentication
// ---------------------------------------------------------------------------

function getBackendToken(session: any): string {
  return jwt.sign(
    {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      role: session.user.role,
    },
    process.env.BACKEND_SECRET || "bi-lite-backend-secret-key-super-secure-87654321",
    { expiresIn: "5m" }
  );
}

// ---------------------------------------------------------------------------
// Create a new chat session
// ---------------------------------------------------------------------------

export async function createChatSession(
  connectionId: string,
  connectionAlias: string,
  title = "New Chat"
): Promise<{ success: true; sessionId: string } | { success: false; error: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/chat/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ connectionId, connectionAlias, title }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to create chat session on backend." };
    }

    revalidatePath("/", "layout");
    return { success: true, sessionId: data.sessionId };
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Update a session title
// ---------------------------------------------------------------------------

export async function updateChatSessionTitle(
  sessionId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to update chat session title on backend." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// List sessions (for sidebar history)
// ---------------------------------------------------------------------------

export async function getChatSessions(connectionId?: string): Promise<ChatSessionSummary[]> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return [];
    }
    if (session.user.email === "test@yopmail.com") {
      return [];
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const url = connectionId
      ? `${BACKEND_URL}/api/chat/sessions?connectionId=${connectionId}`
      : `${BACKEND_URL}/api/chat/sessions`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search sessions
// ---------------------------------------------------------------------------

export async function searchChatSessions(query: string): Promise<ChatSessionSummary[]> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return [];
    }
    if (session.user.email === "test@yopmail.com") {
      return [];
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(
      `${BACKEND_URL}/api/chat/sessions/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Bulk-save messages for a session (upsert-style sync)
// ---------------------------------------------------------------------------

export async function saveChatMessages(
  sessionId: string,
  messages: Array<{
    id: string;
    role: "USER" | "ASSISTANT" | "ERROR";
    content: string;
    chartResult?: unknown;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to save chat messages on backend." };
    }

    return { success: true };
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Load messages for a session
// ---------------------------------------------------------------------------

export async function getChatMessages(sessionId: string): Promise<StoredChatMessage[]> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return [];
    }
    if (session.user.email === "test@yopmail.com") {
      return [];
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Delete a session
// ---------------------------------------------------------------------------

export async function deleteChatSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to delete chat session on backend." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
