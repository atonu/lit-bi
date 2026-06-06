"use server";

import { generateObject } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import * as z from 'zod';
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Output schema — strict shape the AI must conform to
// ---------------------------------------------------------------------------

const AiResponseSchema = z.object({
  // For SQL engines: a SELECT statement. For MongoDB: a JSON string
  // with shape { "collection": "...", "pipeline": [...] }
  sql: z
    .string()
    .describe(
      "For PostgreSQL/MySQL: a read-only SQL SELECT statement with no trailing semicolon. " +
      "For MongoDB: a JSON string with shape { \"collection\": \"<name>\", \"pipeline\": [...aggregation stages] }."
    ),
  chartType: z
    .enum(["LINE", "BAR", "DONUT", "TABLE", "AREA", "SCATTER"])
    .describe(
      "The most appropriate chart type for the data the query will return."
    ),
  chartTitle: z
    .string()
    .describe("A concise, human-readable title for the chart (max 60 chars)."),
  xAxisKey: z
    .string()
    .describe(
      "The field name in the query result to use as the X axis or label."
    ),
  yAxisKey: z
    .string()
    .describe(
      "The field name in the query result to use as the Y axis or primary value."
    ),
  reasoning: z
    .string()
    .describe(
      "1-2 sentence plain English explanation of what the query measures and why this chart type was chosen."
    ),
});

export type AiQueryResponse = z.infer<typeof AiResponseSchema>;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SQL Schema formatter
// ---------------------------------------------------------------------------
// Converts raw SchemaMetadata rows into a compact CREATE TABLE–style prompt
// block. Injected into the system prompt for SQL databases.
// ---------------------------------------------------------------------------

interface SchemaRow {
  tableSchema: string;
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  columnDefault: string | null;
  ordinalPosition: number;
}

function formatSqlSchemaForPrompt(rows: SchemaRow[]): string {
  const tables = new Map<string, SchemaRow[]>();
  for (const row of rows) {
    const key = `${row.tableSchema}.${row.tableName}`;
    const existing = tables.get(key);
    if (existing) {
      existing.push(row);
    } else {
      tables.set(key, [row]);
    }
  }

  const blocks: string[] = [];
  for (const [tableKey, cols] of tables) {
    const sorted = [...cols].sort((a, b) => a.ordinalPosition - b.ordinalPosition);
    const columnDefs = sorted
      .map((c) => {
        const pk = c.isPrimaryKey ? " PRIMARY KEY" : "";
        const nullable = c.isNullable ? "" : " NOT NULL";
        return `  ${c.columnName} ${c.dataType.toUpperCase()}${pk}${nullable}`;
      })
      .join(",\n");
    blocks.push(`TABLE ${tableKey} (\n${columnDefs}\n);`);
  }

  return blocks.join("\n\n");
}

// ---------------------------------------------------------------------------
// MongoDB Schema formatter
// ---------------------------------------------------------------------------
// Converts sampled field metadata into a collection schema block that the
// AI can use to write accurate aggregation pipelines.
// ---------------------------------------------------------------------------

function formatMongoSchemaForPrompt(rows: SchemaRow[]): string {
  // Group by collection (tableName)
  const collections = new Map<string, SchemaRow[]>();
  for (const row of rows) {
    const key = row.tableName;
    const existing = collections.get(key);
    if (existing) {
      existing.push(row);
    } else {
      collections.set(key, [row]);
    }
  }

  const blocks: string[] = [];
  for (const [collName, fields] of collections) {
    const sorted = [...fields].sort((a, b) => a.ordinalPosition - b.ordinalPosition);
    const fieldDefs = sorted
      .map((f) => {
        const pk = f.isPrimaryKey ? "  // primary key" : "";
        return `  ${f.columnName}: ${f.dataType}${pk}`;
      })
      .join(",\n");
    blocks.push(`COLLECTION ${collName} {\n${fieldDefs}\n}`);
  }

  return blocks.join("\n\n");
}

// ---------------------------------------------------------------------------
// System prompt builders
// ---------------------------------------------------------------------------

function buildSqlSystemPrompt(schemaBlock: string): string {
  return `You are an expert SQL analyst and data visualization specialist. Your job is to translate natural language business questions into safe, read-only SQL queries and choose the optimal chart type for the result.

STRICT RULES — YOU MUST FOLLOW THESE OR THE RESPONSE WILL BE REJECTED:
1. Output ONLY a SELECT statement. Never write INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, REVOKE, EXECUTE, CALL, or any DDL/DML.
2. Do NOT include a trailing semicolon in the SQL string.
3. Do NOT use CTEs with non-read-only side effects.
4. Always LIMIT results to at most 500 rows unless the user explicitly asks for more.
5. Prefer qualified column names (table.column) to avoid ambiguity.
6. Use standard SQL-92 syntax compatible with PostgreSQL.

CHART SELECTION GUIDE:
- LINE: Time-series data with a date/timestamp x-axis. Best for trends over time.
- BAR: Categorical comparisons (e.g. sales by region, counts by category). Best for ranking.
- DONUT: Part-of-whole relationships. Best when there are 2-8 distinct categories.
- AREA: Cumulative or stacked time-series. Best for showing volume over time.
- SCATTER: Correlation between two numeric variables.
- TABLE: Raw listing of rows, or when data has too many columns for a chart.

DATABASE SCHEMA:
\`\`\`sql
${schemaBlock}
\`\`\`

When choosing xAxisKey and yAxisKey, use the EXACT column name (or alias) that will appear in the SQL result set.`;
}

function buildMongoSystemPrompt(schemaBlock: string): string {
  return `You are an expert MongoDB analyst and data visualization specialist. Your job is to translate natural language business questions into safe, read-only MongoDB aggregation pipelines and choose the optimal chart type for the result.

STRICT RULES — YOU MUST FOLLOW THESE OR THE RESPONSE WILL BE REJECTED:
1. Output a JSON string ONLY — no markdown fences, no extra text.
2. The JSON must have exactly this shape:
   { "collection": "<collection_name>", "pipeline": [ ...aggregation stages... ] }
3. NEVER use write stages: $out, $merge.
4. NEVER use server-side JavaScript: $where, $function, $accumulator.
5. Always add a $limit stage (max 500) unless the user explicitly asks for more.
6. Use field names exactly as they appear in the schema below.
7. For date grouping, use $dateToString or $dateTrunc in a $group stage.

CHART SELECTION GUIDE:
- LINE: Time-series data with a date x-axis. Best for trends over time.
- BAR: Categorical comparisons (e.g. totals by category). Best for ranking.
- DONUT: Part-of-whole relationships. Best when there are 2-8 distinct categories.
- AREA: Cumulative or stacked time-series. Best for showing volume over time.
- SCATTER: Correlation between two numeric fields.
- TABLE: Raw document listing, or when data has many fields.

DATABASE SCHEMA (sampled field types):
\`\`\`
${schemaBlock}
\`\`\`

When choosing xAxisKey and yAxisKey, use the EXACT field name (or alias) that will appear in the aggregation result documents.

EXAMPLE OUTPUT:
{"collection":"orders","pipeline":[{"$group":{"_id":"$status","count":{"$sum":1}}},{"$sort":{"count":-1}},{"$limit":10}]}`;
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

  // 1. Load the connection to know the engine
  let connectionEngine: string;
  try {
    const conn = await db.databaseConnection.findUnique({
      where: { id: connectionId, status: "CONNECTED" },
      select: { engine: true },
    });
    if (!conn) {
      return {
        success: false,
        error: "Connection not found or is not in CONNECTED state.",
      };
    }
    connectionEngine = conn.engine as string;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to load connection: ${msg}` };
  }

  // 2. Load cached schema metadata
  let schemaRows: SchemaRow[];
  try {
    schemaRows = await db.schemaMetadata.findMany({
      where: { connectionId },
      orderBy: [
        { tableSchema: "asc" },
        { tableName: "asc" },
        { ordinalPosition: "asc" },
      ],
      select: {
        tableSchema: true,
        tableName: true,
        columnName: true,
        dataType: true,
        isNullable: true,
        isPrimaryKey: true,
        columnDefault: true,
        ordinalPosition: true,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to load schema metadata: ${msg}` };
  }

  if (schemaRows.length === 0) {
    return {
      success: false,
      error:
        "No schema metadata found for this connection. Please re-introspect the schema.",
    };
  }

  // 3. Build engine-appropriate system prompt
  const isMongo = connectionEngine === "MONGODB";
  const systemPrompt = isMongo
    ? buildMongoSystemPrompt(formatMongoSchemaForPrompt(schemaRows))
    : buildSqlSystemPrompt(formatSqlSchemaForPrompt(schemaRows));

  // 4. Call DeepSeek via Vercel AI SDK generateObject
  try {
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: AiResponseSchema,
      system: systemPrompt,
      prompt: naturalLanguageQuestion,
      temperature: 0.1, // Low temperature for deterministic query generation
    });

    return {
      success: true,
      response: object,
      connectionId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `AI generation failed: ${msg}` };
  }
}

// ---------------------------------------------------------------------------
// Server Action: getConnections
// ---------------------------------------------------------------------------

export interface ConnectionSummary {
  id: string;
  alias: string;
  engine: "POSTGRESQL" | "MYSQL" | "MONGODB";
  host: string | null;
  dbName: string | null;
  status: string;
}

export async function getConnections(): Promise<ConnectionSummary[]> {
  try {
    const connections = await db.databaseConnection.findMany({
      where: { status: "CONNECTED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        alias: true,
        engine: true,
        host: true,
        dbName: true,
        status: true,
      },
    });
    return connections.map((c) => ({
      ...c,
      engine: c.engine as "POSTGRESQL" | "MYSQL" | "MONGODB",
      status: c.status as string,
    }));
  } catch {
    return [];
  }
}
