"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";

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
// Helper: Resolve active user organization context
// ---------------------------------------------------------------------------

async function getOrgContext() {
  const session = await getServerSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized. Please log in.");
  }
  return {
    organizationId: session.user.organizationId,
    userId: session.user.id,
  };
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
    const { organizationId } = await getOrgContext();

    // Verify database connection belongs to the organization
    const conn = await db.databaseConnection.findFirst({
      where: { id: connectionId, organizationId },
    });
    if (!conn) {
      return { success: false, error: "Database connection not found or unauthorized." };
    }

    const session = await db.chatSession.create({
      data: {
        title,
        connectionId,
        connectionAlias,
        organizationId,
      },
    });
    revalidatePath("/", "layout");
    return { success: true, sessionId: session.id };
  } catch (err) {
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
    const { organizationId } = await getOrgContext();

    // Verify session belongs to the organization
    const existing = await db.chatSession.findFirst({
      where: { id: sessionId, organizationId },
    });
    if (!existing) {
      return { success: false, error: "Chat session not found or unauthorized." };
    }

    await db.chatSession.update({
      where: { id: sessionId },
      data: { title },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// List sessions (for sidebar history)
// ---------------------------------------------------------------------------

export async function getChatSessions(connectionId?: string): Promise<ChatSessionSummary[]> {
  try {
    const { organizationId } = await getOrgContext();

    const sessions = await db.chatSession.findMany({
      where: {
        organizationId,
        ...(connectionId ? { connectionId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        connection: { select: { alias: true } },
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    return sessions.map((s) => {
      let title = s.title;
      if (title === "New Chat" && s.messages.length > 0) {
        const firstMsg = s.messages[0];
        if (firstMsg.content) {
          title = firstMsg.content.slice(0, 20).trim() + (firstMsg.content.length > 20 ? "..." : "");
          db.chatSession.update({
            where: { id: s.id },
            data: { title },
          }).catch(() => {});
        }
      }

      return {
        id: s.id,
        title,
        connectionId: s.connectionId,
        connectionAlias: s.connectionAlias || s.connection?.alias || "Deleted DB",
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
        messageCount: s._count.messages,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search sessions
// ---------------------------------------------------------------------------

export async function searchChatSessions(query: string): Promise<ChatSessionSummary[]> {
  try {
    const { organizationId } = await getOrgContext();

    if (!query.trim()) return getChatSessions();

    const sessions = await db.chatSession.findMany({
      where: {
        organizationId,
        title: { contains: query, mode: "insensitive" as const },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        connection: { select: { alias: true } },
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    return sessions.map((s) => {
      let title = s.title;
      if (title === "New Chat" && s.messages.length > 0) {
        const firstMsg = s.messages[0];
        if (firstMsg.content) {
          title = firstMsg.content.slice(0, 20).trim() + (firstMsg.content.length > 20 ? "..." : "");
          db.chatSession.update({
            where: { id: s.id },
            data: { title },
          }).catch(() => {});
        }
      }

      return {
        id: s.id,
        title,
        connectionId: s.connectionId,
        connectionAlias: s.connectionAlias || s.connection?.alias || "Deleted DB",
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
        messageCount: s._count.messages,
      };
    });
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
    id: string; // client-side temp id
    role: "USER" | "ASSISTANT" | "ERROR";
    content: string;
    chartResult?: unknown;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { organizationId } = await getOrgContext();

    // Verify session belongs to the organization
    const existing = await db.chatSession.findFirst({
      where: { id: sessionId, organizationId },
    });
    if (!existing) {
      return { success: false, error: "Chat session not found or unauthorized." };
    }

    // Delete existing messages and re-insert
    await db.chatMessage.deleteMany({ where: { sessionId } });

    if (messages.length > 0) {
      await db.chatMessage.createMany({
        data: messages.map((m) => ({
          sessionId,
          role: m.role,
          content: m.content,
          chartResult: m.chartResult ? (m.chartResult as object) : undefined,
        })),
      });
    }

    // Touch session updatedAt
    await db.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Load messages for a session
// ---------------------------------------------------------------------------

export async function getChatMessages(sessionId: string): Promise<StoredChatMessage[]> {
  try {
    const { organizationId } = await getOrgContext();

    // Verify session belongs to the organization
    const existing = await db.chatSession.findFirst({
      where: { id: sessionId, organizationId },
    });
    if (!existing) {
      return [];
    }

    const messages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    return messages.map((m) => ({
      id: m.id,
      role: m.role as "USER" | "ASSISTANT" | "ERROR",
      content: m.content,
      chartResult: m.chartResult ?? undefined,
      createdAt: m.createdAt,
    }));
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
    const { organizationId } = await getOrgContext();

    // Verify session belongs to the organization
    const existing = await db.chatSession.findFirst({
      where: { id: sessionId, organizationId },
    });
    if (!existing) {
      return { success: false, error: "Chat session not found or unauthorized." };
    }

    await db.chatSession.delete({ where: { id: sessionId } });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
