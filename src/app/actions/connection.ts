"use server";

import { Pool } from "pg";
import { MongoClient } from "mongodb";
import { db } from "@/lib/db";
import { DatabaseEngine } from "@/generated/prisma";
import { encryptPassword, decryptPassword } from "@/lib/crypto";
import crypto from "crypto";
import { PLACEHOLDER_ORG_ID } from "@/lib/constants";
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
  // MongoDB — full connection URI (e.g. mongodb://... or mongodb+srv://...)
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
// Helper: build a pg connection string
// ---------------------------------------------------------------------------

function buildPgConnectionString(creds: ConnectionCredentials): string {
  const { host, port, dbName, dbUser, password, sslEnabled } = creds;
  const sslParam = sslEnabled ? "?sslmode=require" : "?sslmode=disable";
  return `postgresql://${encodeURIComponent(dbUser!)}:${encodeURIComponent(password!)}@${host}:${port}/${encodeURIComponent(dbName!)}${sslParam}`;
}

// ---------------------------------------------------------------------------
// Action 1a: testConnection — PostgreSQL
// ---------------------------------------------------------------------------

async function testPostgresConnection(
  creds: ConnectionCredentials
): Promise<TestConnectionResult> {
  const connStr = buildPgConnectionString(creds);
  const pool = new Pool({
    connectionString: connStr,
    max: 1,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 1000,
    ssl: creds.sslEnabled ? { rejectUnauthorized: false } : undefined,
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
      const shortVersion = version.split(" ").slice(0, 2).join(" ");
      return { success: true, latencyMs, serverVersion: shortVersion };
    } finally {
      client.release();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const sanitized = message
      .replace(/postgresql:\/\/[^@]+@/, "postgresql://***@")
      .replace(/password=[^\s&]+/gi, "password=***");
    return { success: false, error: sanitized };
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Action 1b: testConnection — MongoDB
// ---------------------------------------------------------------------------

async function testMongoConnection(
  creds: ConnectionCredentials
): Promise<TestConnectionResult> {
  if (!creds.connectionUri) {
    return { success: false, error: "MongoDB connection URI is required." };
  }

  const client = new MongoClient(creds.connectionUri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });

  const start = Date.now();
  try {
    await client.connect();
    const admin = client.db().admin();
    const info = await admin.serverInfo();
    const latencyMs = Date.now() - start;
    return {
      success: true,
      latencyMs,
      serverVersion: `MongoDB ${info.version}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Sanitize — strip credentials from URI in error messages
    const sanitized = message.replace(
      /mongodb(\+srv)?:\/\/[^@]+@/,
      "mongodb$1://***@"
    );
    return { success: false, error: sanitized };
  } finally {
    await client.close();
  }
}

// ---------------------------------------------------------------------------
// Dispatcher: testConnection
// ---------------------------------------------------------------------------

export async function testConnection(
  creds: ConnectionCredentials
): Promise<TestConnectionResult> {
  if (creds.engine === "MONGODB") {
    return testMongoConnection(creds);
  }
  // PostgreSQL and MySQL both use pg-compatible connection strings for now
  // (MySQL support can be added separately with the mysql2 driver)
  return testPostgresConnection(creds);
}

// ---------------------------------------------------------------------------
// Action 2a: introspectSchema — PostgreSQL
// ---------------------------------------------------------------------------

async function introspectPostgresSchema(
  creds: ConnectionCredentials
): Promise<IntrospectResult> {
  const connStr = buildPgConnectionString(creds);
  const pool = new Pool({
    connectionString: connStr,
    max: 1,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 1000,
    ssl: creds.sslEnabled ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const client = await pool.connect();
    try {
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
      await client.query("ROLLBACK").catch(() => { });
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
// Action 2b: introspectSchema — MongoDB
// ---------------------------------------------------------------------------
// MongoDB has no fixed schema. We sample up to 100 documents per collection
// and walk each document's keys to infer field names and BSON types.
// The result is stored in SchemaMetadata exactly like SQL columns, where
// tableName = collection name and columnName = field path (dot-notation).
// ---------------------------------------------------------------------------

/** Recursively walk a sample document and collect all leaf field paths. */
function collectFields(
  obj: Record<string, unknown>,
  prefix = ""
): Array<{ path: string; bsonType: string }> {
  const fields: Array<{ path: string; bsonType: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof Buffer) &&
      // Detect BSON ObjectId (has toHexString method) — treat as string
      !("toHexString" in (value as object))
    ) {
      // Recurse into nested documents (max 2 levels to avoid explosion)
      if (prefix.split(".").length < 2) {
        fields.push(...collectFields(value as Record<string, unknown>, fullPath));
      } else {
        fields.push({ path: fullPath, bsonType: "object" });
      }
    } else {
      // Determine the BSON type
      const bsonType = Array.isArray(value)
        ? "array"
        : value === null
        ? "null"
        : value instanceof Date
        ? "date"
        : typeof value === "object" && value !== null && "toHexString" in (value as object)
        ? "objectId"
        : typeof value === "number"
        ? Number.isInteger(value)
          ? "int"
          : "double"
        : typeof value === "boolean"
        ? "bool"
        : "string";
      fields.push({ path: fullPath, bsonType });
    }
  }
  return fields;
}

async function introspectMongoSchema(
  creds: ConnectionCredentials
): Promise<IntrospectResult> {
  if (!creds.connectionUri) {
    return {
      success: false,
      tables: [],
      columns: [],
      error: "MongoDB connection URI is required.",
    };
  }

  // Parse and store the database name from the URI.
  // This becomes creds.dbName so saveConnection can persist it.
  let dbName: string;
  try {
    const url = new URL(
      creds.connectionUri
        .replace("mongodb+srv://", "https://")
        .replace("mongodb://", "http://")
    );
    const pathDb = url.pathname.replace(/^\//, "").split("?")[0];
    dbName = creds.dbName || pathDb || "";
  } catch {
    dbName = creds.dbName || "";
  }

  if (!dbName) {
    return {
      success: false,
      tables: [],
      columns: [],
      error: "Could not determine the database name from the URI. Please include the database name in your connection URI (e.g. mongodb+srv://user:pass@host/myDatabase).",
    };
  }

  // Write the resolved dbName back to creds so saveConnection can store it
  creds.dbName = dbName;

  const client = new MongoClient(creds.connectionUri, {
    serverSelectionTimeoutMS: 8000,
  });

  try {
    await client.connect();

    // Only introspect the specific database named in the URI
    const mdb = client.db(dbName);

    let collectionInfos: Array<{ name: string }>;
    try {
      collectionInfos = await mdb.listCollections().toArray();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        tables: [],
        columns: [],
        error: `Could not list collections in database "${dbName}": ${msg}`,
      };
    }

    // Filter out the app's own internal Prisma/system collections
    const INTERNAL_COLLECTIONS = new Set([
      "organizations",
      "users",
      "database_connections",
      "schema_metadata",
      "report_templates",
      "system.views",
      "system.indexes",
    ]);

    const collectionNames = collectionInfos
      .map((c) => c.name)
      .filter((name) => !INTERNAL_COLLECTIONS.has(name));

    console.log(`[MongoDB introspect] db="${dbName}" collections found:`, collectionNames);

    const columns: ColumnMetadata[] = [];
    const tables: string[] = [];

    for (const collName of collectionNames) {
      // Table key format: "<dbName>.<collName>"
      tables.push(`${dbName}.${collName}`);
      const coll = mdb.collection(collName);

      // Sample up to 100 documents to infer field types
      const samples = await coll.find({}).limit(100).toArray();

      // Merge field paths from all sampled documents
      const fieldMap = new Map<string, string>(); // path → bsonType
      for (const doc of samples) {
        const fields = collectFields(doc as Record<string, unknown>);
        for (const f of fields) {
          if (!fieldMap.has(f.path) || fieldMap.get(f.path) === "null") {
            fieldMap.set(f.path, f.bsonType);
          }
        }
      }

      let ordinal = 1;
      for (const [path, bsonType] of fieldMap) {
        columns.push({
          tableSchema: dbName,
          tableName: collName,
          columnName: path,
          dataType: bsonType,
          isNullable: true,
          isPrimaryKey: path === "_id",
          columnDefault: null,
          ordinalPosition: ordinal++,
        });
      }
    }

    return { success: true, tables, columns };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      tables: [],
      columns: [],
      error: message.replace(/mongodb(\+srv)?:\/\/[^@]+@/, "mongodb$1://***@"),
    };
  } finally {
    await client.close();
  }
}

// ---------------------------------------------------------------------------
// Dispatcher: introspectSchema
// ---------------------------------------------------------------------------

export async function introspectSchema(
  creds: ConnectionCredentials
): Promise<IntrospectResult> {
  if (creds.engine === "MONGODB") {
    return introspectMongoSchema(creds);
  }
  return introspectPostgresSchema(creds);
}

// ---------------------------------------------------------------------------
// Action 3: saveConnection
// ---------------------------------------------------------------------------

// The placeholder org ID is imported from constants.ts

/**
 * Compute a fingerprint for a connection to enforce uniqueness.
 * Uses SHA-256 of the canonical connection params.
 */
function computeConnectionUniqueKey(creds: ConnectionCredentials): string {
  const raw =
    creds.engine === "MONGODB"
      ? `MONGODB::${creds.connectionUri ?? ""}`
      : `${creds.engine}::${creds.host ?? ""}::${creds.port ?? ""}::${creds.dbName ?? ""}::${creds.dbUser ?? ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function saveConnection(
  creds: ConnectionCredentials,
  columns: ColumnMetadata[]
): Promise<SaveConnectionResult> {
  try {
    // Encrypt the sensitive credential
    let encryptedPassword: string | undefined;
    let encryptedUri: string | undefined;

    if (creds.engine === "MONGODB") {
      if (!creds.connectionUri) {
        return { success: false, error: "MongoDB connection URI is required." };
      }
      encryptedUri = encryptPassword(creds.connectionUri);
    } else {
      if (!creds.password) {
        return { success: false, error: "Password is required." };
      }
      encryptedPassword = encryptPassword(creds.password);
    }

    // Compute a unique fingerprint for this connection
    const uniqueKey = computeConnectionUniqueKey(creds);

    // Check if a connection with the same fingerprint already exists
    const existing = await db.databaseConnection.findFirst({
      where: { uniqueKey },
    });
    if (existing) {
      return {
        success: false,
        error: `A connection to this database already exists: "${existing.alias}". Please edit the existing connection instead of creating a duplicate.`,
      };
    }

    // Ensure the placeholder organization exists
    const org = await db.organization.findUnique({
      where: { id: PLACEHOLDER_ORG_ID },
    });

    if (!org) {
      await db.organization.create({
        data: {
          id: PLACEHOLDER_ORG_ID,
          name: "Default Organization",
          slug: "default",
        },
      });
    }

    // For MongoDB, extract and persist dbName from the URI if not already set
    let resolvedDbName = creds.dbName ?? null;
    if (creds.engine === "MONGODB" && !resolvedDbName && creds.connectionUri) {
      try {
        const url = new URL(
          creds.connectionUri
            .replace("mongodb+srv://", "https://")
            .replace("mongodb://", "http://")
        );
        const pathDb = url.pathname.replace(/^\//, "").split("?")[0];
        if (pathDb) resolvedDbName = pathDb;
      } catch {
        // ignore parse errors
      }
    }

    // Create the connection record
    const connection = await db.databaseConnection.create({
      data: {
        alias: creds.alias,
        engine: creds.engine as DatabaseEngine,
        // SQL fields
        host: creds.host ?? null,
        port: creds.port ?? null,
        dbName: resolvedDbName,
        dbUser: creds.dbUser ?? null,
        encryptedPassword: encryptedPassword ?? null,
        sslEnabled: creds.sslEnabled ?? false,
        // MongoDB field
        encryptedUri: encryptedUri ?? null,
        // Uniqueness fingerprint
        uniqueKey,
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
        // Note: skipDuplicates is not supported by the MongoDB Prisma connector.
        // Duplicate prevention is handled by the unique index on the collection.
      });
    }

    return { success: true, connectionId: connection.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Action 4: deleteConnection
// ---------------------------------------------------------------------------

export async function deleteConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.databaseConnection.delete({
      where: { id: connectionId },
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
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
    await db.databaseConnection.update({
      where: { id: connectionId },
      data: { alias },
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

