"use server";

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Output schema — strict shape the AI must conform to
// ---------------------------------------------------------------------------

const AiResponseSchema = z.object({
  sql: z
    .string()
    .describe(
      "A single, read-safe SQL SELECT statement with no semicolons at the end."
    ),
  chartType: z
    .enum(["LINE", "BAR", "DONUT", "TABLE", "AREA", "SCATTER"])
    .describe(
      "The most appropriate chart type for the data the SQL will return."
    ),
  chartTitle: z
    .string()
    .describe("A concise, human-readable title for the chart (max 60 chars)."),
  xAxisKey: z
    .string()
    .describe(
      "The column name in the query result to use as the X axis or label."
    ),
  yAxisKey: z
    .string()
    .describe(
      "The column name in the query result to use as the Y axis or primary value."
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
// Schema formatter — converts raw SchemaMetadata rows into a compact
// CREATE TABLE–style prompt block. This is injected into the system prompt
// so the AI can write accurate SQL without hitting information_schema.
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

function formatSchemaForPrompt(rows: SchemaRow[]): string {
  // Group rows by "schema.table"
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
// Server Action: askQuestion
// ---------------------------------------------------------------------------
// 1. Loads schema metadata for the connection from our Prisma DB (cached).
// 2. Builds a detailed system prompt that injects the schema.
// 3. Calls Claude 3.5 Sonnet via Vercel AI SDK generateObject with the strict
//    AiResponseSchema so we always get back a typed, validated object.
// 4. Returns the structured result to the client — no raw SQL visible to
//    the user at this stage.
// ---------------------------------------------------------------------------

export async function askQuestion(
  connectionId: string,
  naturalLanguageQuestion: string
): Promise<AskQuestionOutcome> {
  if (!naturalLanguageQuestion.trim()) {
    return { success: false, error: "Question cannot be empty." };
  }

  // 1. Load cached schema metadata from our control plane DB
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

  const schemaBlock = formatSchemaForPrompt(schemaRows);

  // 2. Build the system prompt
  const systemPrompt = `You are an expert SQL analyst and data visualization specialist. Your job is to translate natural language business questions into safe, read-only SQL queries and choose the optimal chart type for the result.

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

  // 3. Call Claude via Vercel AI SDK generateObject
  try {
    const { object } = await generateObject({
      model: anthropic("claude-3-5-sonnet-20241022"),
      schema: AiResponseSchema,
      system: systemPrompt,
      prompt: naturalLanguageQuestion,
      temperature: 0.1, // Low temperature for deterministic SQL generation
    });

    return {
      success: true,
      response: object,
      connectionId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Scrub potential internal details
    const sanitized = msg.replace(/sk-ant-[^\s]+/g, "sk-ant-***");
    return { success: false, error: `AI generation failed: ${sanitized}` };
  }
}

// ---------------------------------------------------------------------------
// Server Action: getConnections
// ---------------------------------------------------------------------------
// Fetches all CONNECTED database connections for the sidebar selector.
// ---------------------------------------------------------------------------

export interface ConnectionSummary {
  id: string;
  alias: string;
  engine: "POSTGRESQL" | "MYSQL";
  host: string;
  dbName: string;
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
      engine: c.engine as "POSTGRESQL" | "MYSQL",
      status: c.status as string,
    }));
  } catch {
    return [];
  }
}
