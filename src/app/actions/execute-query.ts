"use server";

import { Pool } from "pg";
import { MongoClient, Document } from "mongodb";
import { db } from "@/lib/db";
import { decryptPassword } from "@/lib/crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryRow {
  [key: string]: string | number | boolean | null | object;
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
// MQL Safety Guard
// ---------------------------------------------------------------------------
// MongoDB aggregation pipelines arrive as a JSON string.
// We disallow any stage that writes data ($out, $merge) or runs arbitrary JS
// ($where, $function, $accumulator).
// ---------------------------------------------------------------------------

const FORBIDDEN_MQL_STAGES = [
  "$out",
  "$merge",
  "$where",
  "$function",
  "$accumulator",
];

function isSafeMqlPipeline(pipelineJson: string): boolean {
  try {
    const pipeline = JSON.parse(pipelineJson);
    if (!Array.isArray(pipeline)) return false;
    for (const stage of pipeline) {
      const stageKey = Object.keys(stage ?? {})[0];
      if (FORBIDDEN_MQL_STAGES.includes(stageKey)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

const MAX_ROWS = 500;

// ---------------------------------------------------------------------------
// Server Action: executeQuery (dispatcher)
// ---------------------------------------------------------------------------

export async function executeQuery(
  connectionId: string,
  query: string
): Promise<ExecuteQueryOutcome> {
  // 1. Load connection record to determine the engine
  let connection: {
    engine: string;
    host: string | null;
    port: number | null;
    dbName: string | null;
    dbUser: string | null;
    encryptedPassword: string | null;
    encryptedUri: string | null;
    sslEnabled: boolean;
  } | null;

  try {
    connection = await db.databaseConnection.findUnique({
      where: { id: connectionId, status: "CONNECTED" },
      select: {
        engine: true,
        host: true,
        port: true,
        dbName: true,
        dbUser: true,
        encryptedPassword: true,
        encryptedUri: true,
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

  if (connection.engine === "MONGODB") {
    return executeMongoPipeline(connectionId, connection, query);
  }

  return executePostgresQuery(connectionId, connection, query);
}

// ---------------------------------------------------------------------------
// executePostgresQuery — PostgreSQL (existing logic)
// ---------------------------------------------------------------------------

async function executePostgresQuery(
  connectionId: string,
  connection: {
    host: string | null;
    port: number | null;
    dbName: string | null;
    dbUser: string | null;
    encryptedPassword: string | null;
    sslEnabled: boolean;
  },
  sql: string
): Promise<ExecuteQueryOutcome> {
  // Safety pre-check
  if (!isSafeQuery(sql)) {
    return {
      success: false,
      error: "Query rejected: only read-only SELECT statements are permitted.",
    };
  }

  // Decrypt password (server-only, never exposed to client)
  let password: string;
  try {
    password = decryptPassword(connection.encryptedPassword!);
  } catch {
    return {
      success: false,
      error:
        "Failed to decrypt database credentials. Please re-save the connection.",
    };
  }

  const sslParam = connection.sslEnabled ? "?sslmode=require" : "?sslmode=disable";
  const connectionString =
    `postgresql://${encodeURIComponent(connection.dbUser!)}:${encodeURIComponent(password)}` +
    `@${connection.host}:${connection.port}/${encodeURIComponent(connection.dbName!)}${sslParam}`;

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

      const limitedSql = /\bLIMIT\b/i.test(sql)
        ? sql
        : `${sql} LIMIT ${MAX_ROWS}`;

      const result = await client.query<QueryRow>(limitedSql);
      await client.query("COMMIT");

      const executionMs = Date.now() - start;
      const columns = result.fields.map((f) => f.name);

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
    return {
      success: false,
      error: `Database connection failed: ${sanitized}`,
    };
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// executeMongoPipeline — MongoDB
// ---------------------------------------------------------------------------
// The `query` parameter is expected to be a JSON string in the format:
//   { "collection": "orders", "pipeline": [...aggregation stages...] }
//
// The AI generates this format when the connection engine is MONGODB.
// ---------------------------------------------------------------------------

interface MongoQueryPayload {
  collection: string;
  pipeline: Document[];
}

async function executeMongoPipeline(
  _connectionId: string,
  connection: {
    encryptedUri: string | null;
    dbName: string | null;
  },
  queryJson: string
): Promise<ExecuteQueryOutcome> {
  // 1. Parse the query payload
  let payload: MongoQueryPayload;
  
  // Clean up any markdown fences the AI might have added
  let cleanJson = queryJson.trim();
  if (cleanJson.startsWith("```json")) {
    cleanJson = cleanJson.replace(/^```json\n/, "").replace(/\n```$/, "");
  } else if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```\n/, "").replace(/\n```$/, "");
  }

  console.log("=== AI MONGO QUERY ===");
  console.log(cleanJson);

  try {
    payload = JSON.parse(cleanJson);
    if (!payload.collection || !Array.isArray(payload.pipeline)) {
      throw new Error("Invalid format. Expected { collection, pipeline[] }.");
    }
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    return {
      success: false,
      error: `Invalid MongoDB query format: ${msg}`,
    };
  }

  // 2. MQL safety check
  const pipelineJson = JSON.stringify(payload.pipeline);
  if (!isSafeMqlPipeline(pipelineJson)) {
    return {
      success: false,
      error:
        "Query rejected: pipeline contains a forbidden stage ($out, $merge, $where, $function, $accumulator).",
    };
  }

  // 3. Decrypt the connection URI
  let uri: string;
  try {
    uri = decryptPassword(connection.encryptedUri!);
  } catch {
    return {
      success: false,
      error:
        "Failed to decrypt MongoDB credentials. Please re-save the connection.",
    };
  }

  // 4. Determine the target database name:
  //    Priority: connection.dbName (saved at introspection) > URI path segment
  let defaultDbName: string | null = connection.dbName;
  if (!defaultDbName) {
    try {
      const url = new URL(
        uri.replace("mongodb+srv://", "https://").replace("mongodb://", "http://")
      );
      const pathDb = url.pathname.replace(/^\//, "").split("?")[0];
      if (pathDb) defaultDbName = pathDb;
    } catch {
      // ignore
    }
  }

  if (!defaultDbName) {
    return {
      success: false,
      error:
        "Cannot determine which MongoDB database to query. Please re-connect and make sure your connection URI includes the database name (e.g. mongodb+srv://user:pass@host/myDatabase).",
    };
  }

  // Parse target DB and collection from payload if AI prefixed it as "db.collection"
  let targetDbName = defaultDbName;
  let targetCollection = payload.collection;
  if (payload.collection.includes(".")) {
    const parts = payload.collection.split(".");
    // Only accept the db prefix if it matches our known dbName (prevent injection)
    if (parts[0] === defaultDbName) {
      targetDbName = parts[0];
      targetCollection = parts.slice(1).join(".");
    }
    // Otherwise treat the whole thing as the collection name in the default db
  }

  console.log(`=== MONGO EXECUTE: db=${targetDbName} collection=${targetCollection} ===`);
  console.log("Pipeline:", JSON.stringify(payload.pipeline));

  // 5. Run the aggregation pipeline (read-only by design — no write stages pass guard)
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  const start = Date.now();
  try {
    await client.connect();
    const mdb = client.db(targetDbName);
    const coll = mdb.collection(targetCollection);

    // Append $limit stage if not already present
    const hasLimit = payload.pipeline.some((s) => "$limit" in s);
    const safePipeline = hasLimit
      ? payload.pipeline
      : [...payload.pipeline, { $limit: MAX_ROWS }];

    const cursor = coll.aggregate(safePipeline, { allowDiskUse: false });
    const docs = await cursor.toArray();

    const executionMs = Date.now() - start;

    if (docs.length === 0) {
      return {
        success: true,
        rows: [],
        columns: [],
        rowCount: 0,
        executionMs,
      };
    }

    // Derive columns from the union of all keys in the result set
    const columnSet = new Set<string>();
    for (const doc of docs) {
      for (const key of Object.keys(doc)) {
        columnSet.add(key);
      }
    }
    const columns = Array.from(columnSet);

    // Flatten documents to QueryRow — convert ObjectId/Date to strings
    const rows: QueryRow[] = docs.map((doc) => {
      const row: QueryRow = {};
      for (const col of columns) {
        const val = doc[col];
        if (val === undefined || val === null) {
          row[col] = null;
        } else if (typeof val === "object" && "toHexString" in val) {
          // ObjectId
          row[col] = (val as { toHexString: () => string }).toHexString();
        } else if (val instanceof Date) {
          row[col] = val.toISOString();
        } else if (typeof val === "object") {
          row[col] = JSON.stringify(val);
        } else {
          row[col] = val as string | number | boolean;
        }
      }
      return row;
    });

    return {
      success: true,
      rows,
      columns,
      rowCount: rows.length,
      executionMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const sanitized = msg.replace(
      /mongodb(\+srv)?:\/\/[^@]+@/g,
      "mongodb$1://***@"
    );
    return {
      success: false,
      error: `MongoDB query failed: ${sanitized}`,
    };
  } finally {
    await client.close();
  }
}
