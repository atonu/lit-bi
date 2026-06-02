"use server";

import { Pool } from "pg";
import { db } from "@/lib/db";
import { decryptPassword } from "@/lib/crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryRow {
  [key: string]: string | number | boolean | null;
}

export interface ExecuteQueryResult {
  success: true;
  rows: QueryRow[];
  columns: string[];
  rowCount: number;
  executionMs: number;
}

export interface ExecuteQueryError {
  success: false;
  error: string;
}

export type ExecuteQueryOutcome = ExecuteQueryResult | ExecuteQueryError;

// ---------------------------------------------------------------------------
// SQL Safety Guard
// ---------------------------------------------------------------------------
// Belt-and-suspenders check before we even send the query to the DB.
// The AI prompt already restricts output to SELECT, but we verify here too.
// ---------------------------------------------------------------------------

const FORBIDDEN_PATTERN =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE|CALL|COPY|VACUUM|ANALYZE|CLUSTER|REINDEX|LOCK|SET\s+ROLE|SET\s+SESSION|pg_read_file|pg_ls_dir|lo_import|lo_export)\b/i;

function isSafeQuery(sql: string): boolean {
  const stripped = sql
    .replace(/--[^\n]*/g, "") // strip single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // strip block comments
    .trim();

  // Must start with SELECT or WITH (for CTEs that start with SELECT)
  if (!/^(SELECT|WITH)\b/i.test(stripped)) return false;

  // Must not contain forbidden keywords
  if (FORBIDDEN_PATTERN.test(stripped)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Server Action: executeQuery
// ---------------------------------------------------------------------------
// 1. Loads the connection record from the control-plane DB.
// 2. Decrypts the stored password.
// 3. Runs the AI-generated SQL inside a READ ONLY transaction.
// 4. Returns typed rows with column names.
//
// Security properties:
// - Password is decrypted server-side and NEVER sent to the client.
// - The query runs in a READ ONLY transaction — PostgreSQL will reject any
//   statement that attempts a write.
// - The SQL is validated by isSafeQuery before even opening a connection.
// - Pool is created per-request with max=1 and immediately closed.
// ---------------------------------------------------------------------------

const MAX_ROWS = 500;

export async function executeQuery(
  connectionId: string,
  sql: string
): Promise<ExecuteQueryOutcome> {
  // 1. Safety pre-check
  if (!isSafeQuery(sql)) {
    return {
      success: false,
      error:
        "Query rejected: only read-only SELECT statements are permitted.",
    };
  }

  // 2. Load connection credentials from the control plane
  let connection: {
    host: string;
    port: number;
    dbName: string;
    dbUser: string;
    encryptedPassword: string;
    sslEnabled: boolean;
  } | null;

  try {
    connection = await db.databaseConnection.findUnique({
      where: { id: connectionId, status: "CONNECTED" },
      select: {
        host: true,
        port: true,
        dbName: true,
        dbUser: true,
        encryptedPassword: true,
        sslEnabled: true,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Control plane error: ${msg}` };
  }

  if (!connection) {
    return {
      success: false,
      error: "Connection not found or is not in CONNECTED state.",
    };
  }

  // 3. Decrypt password (server-only, never exposed to client)
  let password: string;
  try {
    password = decryptPassword(connection.encryptedPassword);
  } catch {
    return {
      success: false,
      error: "Failed to decrypt database credentials. Please re-save the connection.",
    };
  }

  // 4. Build connection string
  const sslParam = connection.sslEnabled ? "?sslmode=require" : "?sslmode=disable";
  const connectionString =
    `postgresql://${encodeURIComponent(connection.dbUser)}:${encodeURIComponent(password)}` +
    `@${connection.host}:${connection.port}/${encodeURIComponent(connection.dbName)}${sslParam}`;

  // 5. Execute in a read-only transaction
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 1_000,
  });

  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");

      // Append LIMIT if not already present to cap result size
      const limitedSql = /\bLIMIT\b/i.test(sql)
        ? sql
        : `${sql} LIMIT ${MAX_ROWS}`;

      const result = await client.query<QueryRow>(limitedSql);
      await client.query("COMMIT");

      const executionMs = Date.now() - start;
      const columns =
        result.fields.map((f) => f.name);

      return {
        success: true,
        rows: result.rows,
        columns,
        rowCount: result.rowCount ?? result.rows.length,
        executionMs,
      };
    } catch (queryErr) {
      await client.query("ROLLBACK").catch(() => {});
      const msg =
        queryErr instanceof Error ? queryErr.message : String(queryErr);
      // Sanitize — never leak connection details in error messages
      const sanitized = msg
        .replace(/postgresql:\/\/[^@]+@/g, "postgresql://***@")
        .replace(/password=[^\s&]+/gi, "password=***");
      return { success: false, error: `Query execution failed: ${sanitized}` };
    } finally {
      client.release();
    }
  } catch (connErr) {
    const msg = connErr instanceof Error ? connErr.message : String(connErr);
    const sanitized = msg
      .replace(/postgresql:\/\/[^@]+@/g, "postgresql://***@")
      .replace(/password=[^\s&]+/gi, "password=***");
    return { success: false, error: `Database connection failed: ${sanitized}` };
  } finally {
    await pool.end();
  }
}
