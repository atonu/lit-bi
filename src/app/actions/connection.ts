"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";
import jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConnectionCredentials {
  alias: string;
  engine: "POSTGRESQL" | "MYSQL" | "MONGODB";
  // SQL engines (PostgreSQL, MySQL)
  host?: string;
  port?: number;
  dbName?: string;
  dbUser?: string;
  password?: string;
  sslEnabled?: boolean;
  // MongoDB — full connection URI
  connectionUri?: string;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs?: number;
  serverVersion?: string;
  error?: string;
}

export interface ColumnMetadata {
  tableSchema: string;
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  columnDefault: string | null;
  ordinalPosition: number;
}

export interface IntrospectResult {
  success: boolean;
  tables: string[];
  columns: ColumnMetadata[];
  error?: string;
}

export interface SaveConnectionResult {
  success: boolean;
  connectionId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helper: Sign backend token
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
// Action 1: testConnection
// ---------------------------------------------------------------------------

export async function testConnection(
  creds: ConnectionCredentials
): Promise<TestConnectionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const payload = { ...creds };
    if (payload.engine === "MONGODB" && payload.connectionUri === "mongodb+srv://********************************************************") {
      payload.connectionUri = process.env.SAMPLE_DATASET_URI || "mongodb+srv://atonuzahin_db_user:2wsxXSW@dataview.fdlu509.mongodb.net/bilite-test";
    }

    const res = await fetch(`${BACKEND_URL}/api/connection/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to test connection on backend.",
      };
    }

    return {
      success: true,
      latencyMs: data.latencyMs,
      serverVersion: data.serverVersion,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Backend connection error: ${err.message || String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Action 2: introspectSchema
// ---------------------------------------------------------------------------

export async function introspectSchema(
  creds: ConnectionCredentials
): Promise<IntrospectResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, tables: [], columns: [], error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const payload = { ...creds };
    if (payload.engine === "MONGODB" && payload.connectionUri === "mongodb+srv://********************************************************") {
      payload.connectionUri = process.env.SAMPLE_DATASET_URI || "mongodb+srv://atonuzahin_db_user:2wsxXSW@dataview.fdlu509.mongodb.net/bilite-test";
    }

    const res = await fetch(`${BACKEND_URL}/api/connection/introspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        tables: [],
        columns: [],
        error: data.error || "Failed to introspect schema on backend.",
      };
    }

    return {
      success: true,
      tables: data.tables,
      columns: data.columns,
    };
  } catch (err: any) {
    return {
      success: false,
      tables: [],
      columns: [],
      error: `Backend connection error: ${err.message || String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Action 3: saveConnection
// ---------------------------------------------------------------------------

export async function saveConnection(
  creds: ConnectionCredentials,
  columns: ColumnMetadata[]
): Promise<SaveConnectionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const payload = { ...creds };
    if (payload.engine === "MONGODB" && payload.connectionUri === "mongodb+srv://********************************************************") {
      payload.connectionUri = process.env.SAMPLE_DATASET_URI || "mongodb+srv://atonuzahin_db_user:2wsxXSW@dataview.fdlu509.mongodb.net/bilite-test";
    }

    const res = await fetch(`${BACKEND_URL}/api/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ creds: payload, columns }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to save connection on backend.",
      };
    }

    revalidatePath("/", "layout");
    return { success: true, connectionId: data.connectionId };
  } catch (err: any) {
    return {
      success: false,
      error: `Backend error: ${err.message || String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Action 4: deleteConnection
// ---------------------------------------------------------------------------

export async function deleteConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/connections/${connectionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to delete connection on backend.",
      };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Backend error: ${err.message || String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Action 5: updateConnectionAlias
// ---------------------------------------------------------------------------

export async function updateConnectionAlias(
  connectionId: string,
  alias: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const token = getBackendToken(session);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

    const res = await fetch(`${BACKEND_URL}/api/connections/${connectionId}/alias`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ alias }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to update connection alias on backend.",
      };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Backend error: ${err.message || String(err)}`,
    };
  }
}
