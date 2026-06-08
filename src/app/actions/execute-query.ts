"use server";

import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";
const BACKEND_SECRET = process.env.BACKEND_SECRET || "bi-lite-backend-secret-key-super-secure-87654321";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryRow {
  [key: string]: string | number | boolean | null | object;
}

export interface ExecuteQueryInitResult {
  success: true;
  jobId: string;
}

export interface ExecuteQueryError {
  success: false;
  error: string;
}

export type ExecuteQueryInitOutcome = ExecuteQueryInitResult | ExecuteQueryError;

export interface JobStatusResult {
  success: true;
  status: "pending" | "processing" | "completed" | "failed";
  rowCount: number;
  columns: string[];
  durationMs: number;
  error: string | null;
}

export interface JobResultsResult {
  success: true;
  rows: any[];
  pageNum: number;
  totalPages: number;
  rowCount: number;
}

// ---------------------------------------------------------------------------
// Helper: Sign JWT for backend authentication
// ---------------------------------------------------------------------------

function signBackendToken(session: any): string {
  return jwt.sign(
    {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      role: session.user.role,
    },
    BACKEND_SECRET,
    { expiresIn: "5m" } // Short-lived token for security
  );
}

// ---------------------------------------------------------------------------
// Server Action: executeQuery (initializes job)
// ---------------------------------------------------------------------------

export async function executeQuery(
  connectionId: string,
  query: string
): Promise<ExecuteQueryInitOutcome> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }
  const organizationId = session.user.organizationId;

  // Verify target connection belongs to the organization
  const conn = await db.databaseConnection.findFirst({
    where: { id: connectionId, organizationId },
    select: { engine: true },
  });

  if (!conn) {
    return { success: false, error: "Database connection not found or unauthorized." };
  }

  const token = signBackendToken(session);

  try {
    const res = await fetch(`${BACKEND_URL}/api/query/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        connectionId,
        engine: conn.engine,
        query,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to start query execution on backend." };
    }

    return { success: true, jobId: data.jobId };
  } catch (err: any) {
    return { success: false, error: `Backend connection error: ${err.message || String(err)}` };
  }
}

// ---------------------------------------------------------------------------
// Server Action: checkQueryJobStatus
// ---------------------------------------------------------------------------

export async function checkQueryJobStatus(
  jobId: string
): Promise<JobStatusResult | ExecuteQueryError> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const token = signBackendToken(session);

  try {
    const res = await fetch(`${BACKEND_URL}/api/query/status/${jobId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to fetch job status." };
    }

    return {
      success: true,
      status: data.status,
      rowCount: data.rowCount,
      columns: data.columns,
      durationMs: data.durationMs,
      error: data.error,
    };
  } catch (err: any) {
    return { success: false, error: `Backend status error: ${err.message || String(err)}` };
  }
}

// ---------------------------------------------------------------------------
// Server Action: getQueryJobResults (paginated)
// ---------------------------------------------------------------------------

export async function getQueryJobResults(
  jobId: string,
  page = 1
): Promise<JobResultsResult | ExecuteQueryError> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const token = signBackendToken(session);

  try {
    const res = await fetch(`${BACKEND_URL}/api/query/results/${jobId}?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Failed to fetch job results." };
    }

    return {
      success: true,
      rows: data.rows,
      pageNum: data.pageNum,
      totalPages: data.totalPages,
      rowCount: data.rowCount,
    };
  } catch (err: any) {
    return { success: false, error: `Backend results error: ${err.message || String(err)}` };
  }
}
