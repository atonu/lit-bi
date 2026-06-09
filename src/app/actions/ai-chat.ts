"use server";

import { getServerSession } from "@/lib/session";
import jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

export type AiQueryResponse = {
  sql: string;
  chartType: "LINE" | "BAR" | "DONUT" | "TABLE" | "AREA" | "SCATTER";
  chartTitle: string;
  xAxisKey: string;
  yAxisKey: string;
  yAxisKeys?: string[];
  reasoning: string;
};

export interface AskQuestionResult {
  success: true;
  response: AiQueryResponse;
  connectionId: string;
}

export interface AskQuestionError {
  success: false;
  error: string;
}

export type AskQuestionOutcome = AskQuestionResult | AskQuestionError;

export interface ConnectionSummary {
  id: string;
  alias: string;
  engine: "POSTGRESQL" | "MYSQL" | "MONGODB";
  host: string | null;
  dbName: string | null;
  status: string;
}

export interface ConnectionDetail {
  id: string;
  alias: string;
  engine: "POSTGRESQL" | "MYSQL" | "MONGODB";
  host: string | null;
  port: number | null;
  dbName: string | null;
  dbUser: string | null;
  sslEnabled: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Helper: Sign JWT for backend
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
// Server Action: askQuestion
// ---------------------------------------------------------------------------

export async function askQuestion(
  connectionId: string,
  naturalLanguageQuestion: string
): Promise<AskQuestionOutcome> {
  if (!naturalLanguageQuestion.trim()) {
    return { success: false, error: "Question cannot be empty." };
  }

  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/chat/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ connectionId, question: naturalLanguageQuestion }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to parse question on backend.",
      };
    }

    return {
      success: true,
      response: data.response,
      connectionId: data.connectionId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Backend connection error: ${err.message || String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Server Action: getConnections
// ---------------------------------------------------------------------------

export async function getConnections(): Promise<ConnectionSummary[]> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) return [];
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/connections`, {
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
// Server Action: getAllConnections
// ---------------------------------------------------------------------------

export async function getAllConnections(): Promise<ConnectionDetail[]> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) return [];
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/connections/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.map((d: any) => ({
      ...d,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
      lastTestedAt: d.lastTestedAt ? new Date(d.lastTestedAt) : null,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Server Action: generateChatTitle
// ---------------------------------------------------------------------------

export async function generateChatTitle(
  firstMessage: string
): Promise<string> {
  const fallback = firstMessage.slice(0, 40).trim() + (firstMessage.length > 40 ? "…" : "");
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) return fallback;
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/chat/generate-title`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ firstMessage }),
    });

    if (!res.ok) return fallback;
    const data = await res.json();
    return data.title || fallback;
  } catch {
    return fallback;
  }
}
