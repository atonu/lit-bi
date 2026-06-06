"use server";

import { db } from "@/lib/db";
import { PLACEHOLDER_ORG_ID } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatSessionSummary {
  id: string;
  title: string;
  connectionId: string;
  connectionAlias?: string;
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
// Create a new chat session
// ---------------------------------------------------------------------------

export async function createChatSession(
  connectionId: string,
  title = "New Chat"
): Promise<{ success: true; sessionId: string } | { success: false; error: string }> {
  try {
    const session = await db.chatSession.create({
      data: {
        title,
        connectionId,
        organizationId: PLACEHOLDER_ORG_ID,
      },
    });
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
    await db.chatSession.update({
      where: { id: sessionId },
      data: { title },
    });
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
    const sessions = await db.chatSession.findMany({
      where: connectionId ? { connectionId } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        connection: { select: { alias: true } },
        _count: { select: { messages: true } },
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      connectionId: s.connectionId,
      connectionAlias: s.connection.alias,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
      messageCount: s._count.messages,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search sessions
// ---------------------------------------------------------------------------

export async function searchChatSessions(query: string): Promise<ChatSessionSummary[]> {
  if (!query.trim()) return getChatSessions();
  try {
    const sessions = await db.chatSession.findMany({
      where: {
        title: { contains: query, mode: "insensitive" as const },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        connection: { select: { alias: true } },
        _count: { select: { messages: true } },
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      connectionId: s.connectionId,
      connectionAlias: s.connection.alias,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
      messageCount: s._count.messages,
    }));
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
    id: string; // client-side temp id (used to detect new messages)
    role: "USER" | "ASSISTANT" | "ERROR";
    content: string;
    chartResult?: unknown;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete existing messages and re-insert (simplest sync strategy)
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
    await db.chatSession.delete({ where: { id: sessionId } });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
