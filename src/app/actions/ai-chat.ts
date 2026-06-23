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
  naturalLanguageQuestion: string,
  model?: string
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
      body: JSON.stringify({ connectionId, question: naturalLanguageQuestion, model }),
      cache: "no-store",
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      return {
        success: false,
        error: `Backend returned non-JSON response (status ${res.status}): ${text.slice(0, 200)}`,
      };
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Backend error (status ${res.status})`,
      };
    }

    return {
      success: true,
      response: data.response,
      connectionId: data.connectionId,
    };
  } catch (err: any) {
    console.error("[askQuestion] Error:", err);
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
      cache: "no-store",
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
      cache: "no-store",
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
  firstMessage: string,
  model?: string
): Promise<string> {
  const fallback = firstMessage.slice(0, 40).trim() + (firstMessage.length > 40 ? "\u2026" : "");
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
      body: JSON.stringify({ firstMessage, model }),
      cache: "no-store",
    });

    if (!res.ok) return fallback;
    const data = await res.json();
    return data.title || fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Server Action: uploadFile
// ---------------------------------------------------------------------------

export async function uploadFile(
  formData: FormData
): Promise<{ success: true; uploadId: string; fileName: string; columns: string[]; rowCount: number; sampleRows: any[] } | { success: false; error: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/upload/data`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      return { success: false, error: `Upload returned non-JSON response (status ${res.status})` };
    }
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Upload failed." };
    }
    return { success: true, uploadId: data.uploadId, fileName: data.fileName, columns: data.columns, rowCount: data.rowCount, sampleRows: data.sampleRows };
  } catch (err: any) {
    console.error("[uploadFile] Error:", err);
    return { success: false, error: err.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// Server Action: askUploadQuestion
// ---------------------------------------------------------------------------

export async function askUploadQuestion(
  uploadId: string,
  question: string,
  columns: string[],
  sampleRows: any[],
  model?: string
): Promise<{ success: true; response: AiQueryResponse; rows: any[]; columns: string[] } | { success: false; error: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/chat/ask-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uploadId, question, columns, sampleRows, model }),
      cache: "no-store",
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      return { success: false, error: `Backend returned non-JSON response (status ${res.status})` };
    }
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "AI analysis failed." };
    }
    return { success: true, response: data.response, rows: data.rows || sampleRows, columns: data.columns || columns };
  } catch (err: any) {
    console.error("[askUploadQuestion] Error:", err);
    return { success: false, error: err.message || String(err) };
  }
}
