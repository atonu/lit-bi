"use server";

import { generateObject, generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import * as z from 'zod';
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Output schema — strict shape the AI must conform to (SQL engines only)
// ---------------------------------------------------------------------------

const SqlAiResponseSchema = z.object({
  // A read-only SELECT statement with no trailing semicolon
  sql: z
    .string()
    .describe(
      "A read-only SQL SELECT statement with no trailing semicolon."
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

export type AiQueryResponse = {
  sql: string;
  chartType: "LINE" | "BAR" | "DONUT" | "TABLE" | "AREA" | "SCATTER";
  chartTitle: string;
  xAxisKey: string;
  yAxisKey: string;
  reasoning: string;
};

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

function formatMongoSchemaForPrompt(rows: SchemaRow[]): string {
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
  return `You are an expert MongoDB analyst and data visualization specialist. Translate the user's question into a MongoDB aggregation pipeline and choose the best chart type.

You MUST respond with ONLY a single valid JSON object — no markdown, no explanation, no extra text. The JSON must have exactly these keys:

{
  "collection": "<collection name from schema>",
  "pipeline": [ ...aggregation stages... ],
  "chartType": "TABLE" | "BAR" | "LINE" | "DONUT" | "AREA" | "SCATTER",
  "chartTitle": "<concise title, max 60 chars>",
  "xAxisKey": "<field name that will appear in result documents>",
  "yAxisKey": "<field name that will appear in result documents>",
  "reasoning": "<1-2 sentence explanation>"
}

PIPELINE RULES:
- NEVER use write stages: $out, $merge
- NEVER use server-side JS: $where, $function, $accumulator
- Always include a $limit stage (max 500) unless the user asks for more
- Use field names EXACTLY as they appear in the schema

CHART SELECTION:
- TABLE: listing raw documents / many fields (use this for simple "show me" queries)
- BAR: categorical comparisons
- LINE: time-series trends
- DONUT: part-of-whole (2-8 categories)
- AREA: cumulative time-series
- SCATTER: correlation between two numeric fields

DATABASE SCHEMA:
\`\`\`
${schemaBlock}
\`\`\`

EXAMPLE — "show me 5 employees":
{"collection":"employees","pipeline":[{"$limit":5}],"chartType":"TABLE","chartTitle":"Employees","xAxisKey":"name","yAxisKey":"name","reasoning":"Listing raw employee documents as a table."}`;
}

// ---------------------------------------------------------------------------
// MongoDB-specific AI call — uses generateText + manual parse
// ---------------------------------------------------------------------------

async function askMongoQuestion(
  connectionId: string,
  naturalLanguageQuestion: string,
  schemaRows: SchemaRow[]
): Promise<AskQuestionOutcome> {
  const systemPrompt = buildMongoSystemPrompt(formatMongoSchemaForPrompt(schemaRows));

  let rawText: string;
  try {
    const result = await generateText({
      model: deepseek("deepseek-chat"),
      system: systemPrompt,
      prompt: naturalLanguageQuestion,
      temperature: 0.1,
    });
    rawText = result.text.trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `AI generation failed: ${msg}` };
  }

  console.log("=== MONGO AI RAW RESPONSE ===");
  console.log(rawText);

  // Strip markdown fences if the model added them
  let jsonStr = rawText;
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let parsed: {
    collection: string;
    pipeline: unknown[];
    chartType: AiQueryResponse["chartType"];
    chartTitle: string;
    xAxisKey: string;
    yAxisKey: string;
    reasoning: string;
  };
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Mongo AI response:", jsonStr);
    return {
      success: false,
      error: `AI returned invalid JSON for MongoDB query: ${String(e)}. Raw: ${jsonStr.slice(0, 200)}`,
    };
  }

  // Validate required fields
  if (!parsed.collection || !Array.isArray(parsed.pipeline)) {
    return {
      success: false,
      error: `AI response missing required fields (collection, pipeline). Got: ${jsonStr.slice(0, 200)}`,
    };
  }

  // Build the sql field as the serialized payload that executeMongoPipeline expects
  const mongoPayload = JSON.stringify({
    collection: parsed.collection,
    pipeline: parsed.pipeline,
  });

  const VALID_CHART_TYPES = ["LINE", "BAR", "DONUT", "TABLE", "AREA", "SCATTER"] as const;
  const chartType = VALID_CHART_TYPES.includes(parsed.chartType as typeof VALID_CHART_TYPES[number])
    ? parsed.chartType
    : "TABLE";

  return {
    success: true,
    response: {
      sql: mongoPayload,
      chartType,
      chartTitle: parsed.chartTitle || "Query Result",
      xAxisKey: parsed.xAxisKey || "_id",
      yAxisKey: parsed.yAxisKey || "_id",
      reasoning: parsed.reasoning || "",
    },
    connectionId,
  };
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    const organizationId = session.user.organizationId;

    const conn = await db.databaseConnection.findFirst({
      where: { id: connectionId, status: "CONNECTED", organizationId },
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

  // 3. Route to engine-specific handler
  if (connectionEngine === "MONGODB") {
    return askMongoQuestion(connectionId, naturalLanguageQuestion, schemaRows);
  }

  // 4. SQL path — use generateObject (works well with structured schema)
  const systemPrompt = buildSqlSystemPrompt(formatSqlSchemaForPrompt(schemaRows));
  try {
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: SqlAiResponseSchema,
      system: systemPrompt,
      prompt: naturalLanguageQuestion,
      temperature: 0.1,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return [];
    const organizationId = session.user.organizationId;

    const connections = await db.databaseConnection.findMany({
      where: { status: "CONNECTED", organizationId },
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

// ---------------------------------------------------------------------------
// Server Action: getAllConnections (includes all statuses for management)
// ---------------------------------------------------------------------------

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

export async function getAllConnections(): Promise<ConnectionDetail[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return [];
    const organizationId = session.user.organizationId;

    const connections = await db.databaseConnection.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        alias: true,
        engine: true,
        host: true,
        port: true,
        dbName: true,
        dbUser: true,
        sslEnabled: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastTestedAt: true,
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

// ---------------------------------------------------------------------------
// Server Action: generateChatTitle
// ---------------------------------------------------------------------------
// Uses DeepSeek to generate a concise 4-6 word title from the user's first message.
// Falls back to a truncated version of the message on failure.
// ---------------------------------------------------------------------------

export async function generateChatTitle(
  firstMessage: string
): Promise<string> {
  const fallback = firstMessage.slice(0, 40).trim() + (firstMessage.length > 40 ? "…" : "");
  try {
    const result = await generateText({
      model: deepseek("deepseek-chat"),
      system:
        "Generate a concise 4-6 word title for a chat conversation based on the user's first message. Output ONLY the title — no quotes, no punctuation at the end, no explanation.",
      prompt: firstMessage,
      temperature: 0.3,
    });
    const title = result.text.trim().replace(/^["']|["']$/g, "").slice(0, 60);
    return title || fallback;
  } catch {
    return fallback;
  }
}

