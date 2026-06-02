"use server";

import { Pool } from "pg";
import { db } from "@/lib/db";
import { DatabaseEngine } from "@/generated/prisma/client";
import { encryptPassword } from "@/lib/crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConnectionCredentials {
  alias: string;
  engine: "POSTGRESQL" | "MYSQL";
  host: string;
  port: number;
  dbName: string;
  dbUser: string;
  password: string;
  sslEnabled: boolean;
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
// Helper: build a pg connection string
// ---------------------------------------------------------------------------

function buildConnectionString(creds: ConnectionCredentials): string {
  const { host, port, dbName, dbUser, password, sslEnabled } = creds;
  const sslParam = sslEnabled ? "?sslmode=require" : "?sslmode=disable";
  return `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(dbName)}${sslParam}`;
}

// ---------------------------------------------------------------------------
// Action 1: testConnection
// ---------------------------------------------------------------------------
// Creates a short-lived pg Pool, runs SELECT 1, measures latency, and returns
// server version. Runs strictly read-only — no DDL or DML.
// ---------------------------------------------------------------------------

export async function testConnection(
  creds: ConnectionCredentials
): Promise<TestConnectionResult> {
  const connStr = buildConnectionString(creds);
  const pool = new Pool({
    connectionString: connStr,
    max: 1,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 1000,
  });

  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      const result = await client.query<{ version: string }>(
        "SELECT version() AS version"
      );
      const latencyMs = Date.now() - start;
      const version = result.rows[0]?.version ?? "Unknown";
      // Extract e.g. "PostgreSQL 15.3" from the full version string
      const shortVersion = version.split(" ").slice(0, 2).join(" ");
      return { success: true, latencyMs, serverVersion: shortVersion };
    } finally {
      client.release();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Sanitize the error — never expose the raw connection string
    const sanitized = message
      .replace(/postgresql:\/\/[^@]+@/, "postgresql://***@")
      .replace(/password=[^\s&]+/gi, "password=***");
    return { success: false, error: sanitized };
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Action 2: introspectSchema
// ---------------------------------------------------------------------------
// Queries information_schema.columns to reflect all user tables and columns.
// Wrapped in a read-only transaction for maximum safety.
// ---------------------------------------------------------------------------

export async function introspectSchema(
  creds: ConnectionCredentials
): Promise<IntrospectResult> {
  const connStr = buildConnectionString(creds);
  const pool = new Pool({
    connectionString: connStr,
    max: 1,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 1000,
  });

  try {
    const client = await pool.connect();
    try {
      // Enforce read-only at the transaction level
      await client.query("BEGIN READ ONLY");

      const result = await client.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
        ordinal_position: number;
      }>(`
        SELECT
          c.table_schema,
          c.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.ordinal_position
        FROM information_schema.columns c
        JOIN information_schema.tables t
          ON c.table_schema = t.table_schema
         AND c.table_name   = t.table_name
        WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
          AND t.table_type = 'BASE TABLE'
        ORDER BY c.table_schema, c.table_name, c.ordinal_position
      `);

      // Detect primary keys via key_column_usage
      const pkResult = await client.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
      }>(`
        SELECT
          kcu.table_schema,
          kcu.table_name,
          kcu.column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc
          ON kcu.constraint_name = tc.constraint_name
         AND kcu.table_schema    = tc.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND kcu.table_schema NOT IN ('information_schema', 'pg_catalog')
      `);

      await client.query("COMMIT");

      const pkSet = new Set(
        pkResult.rows.map(
          (r) => `${r.table_schema}.${r.table_name}.${r.column_name}`
        )
      );

      const columns: ColumnMetadata[] = result.rows.map((row) => ({
        tableSchema: row.table_schema,
        tableName: row.table_name,
        columnName: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === "YES",
        isPrimaryKey: pkSet.has(
          `${row.table_schema}.${row.table_name}.${row.column_name}`
        ),
        columnDefault: row.column_default,
        ordinalPosition: row.ordinal_position,
      }));

      const tables = [...new Set(columns.map((c) => `${c.tableSchema}.${c.tableName}`))];

      return { success: true, tables, columns };
    } catch (innerErr) {
      await client.query("ROLLBACK").catch(() => {});
      throw innerErr;
    } finally {
      client.release();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      tables: [],
      columns: [],
      error: message.replace(/postgresql:\/\/[^@]+@/, "postgresql://***@"),
    };
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Action 3: saveConnection
// ---------------------------------------------------------------------------
// Encrypts the password, persists the connection + schema metadata to Prisma.
// Uses a hardcoded organizationId for now (auth wired in Phase 4+).
// ---------------------------------------------------------------------------

const PLACEHOLDER_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function saveConnection(
  creds: ConnectionCredentials,
  columns: ColumnMetadata[]
): Promise<SaveConnectionResult> {
  try {
    const encryptedPassword = encryptPassword(creds.password);

    // Upsert org placeholder (for pre-auth phase)
    await db.organization.upsert({
      where: { id: PLACEHOLDER_ORG_ID },
      update: {},
      create: {
        id: PLACEHOLDER_ORG_ID,
        name: "Default Organization",
        slug: "default",
      },
    });

    // Create the connection record
    const connection = await db.databaseConnection.create({
      data: {
        alias: creds.alias,
        engine: creds.engine as DatabaseEngine,
        host: creds.host,
        port: creds.port,
        dbName: creds.dbName,
        dbUser: creds.dbUser,
        encryptedPassword,
        sslEnabled: creds.sslEnabled,
        status: "CONNECTED",
        lastTestedAt: new Date(),
        organizationId: PLACEHOLDER_ORG_ID,
      },
    });

    // Bulk-insert schema metadata
    if (columns.length > 0) {
      await db.schemaMetadata.createMany({
        data: columns.map((col) => ({
          tableSchema: col.tableSchema,
          tableName: col.tableName,
          columnName: col.columnName,
          dataType: col.dataType,
          isNullable: col.isNullable,
          isPrimaryKey: col.isPrimaryKey,
          columnDefault: col.columnDefault,
          ordinalPosition: col.ordinalPosition,
          connectionId: connection.id,
        })),
        skipDuplicates: true,
      });
    }

    return { success: true, connectionId: connection.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
