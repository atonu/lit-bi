"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table2,
  Columns3,
  Key,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import type {
  IntrospectResult,
  ColumnMetadata,
} from "@/app/actions/connection";

interface StepSchemaProps {
  result: IntrospectResult | null;
  isSaving: boolean;
  onSave: (selectedColumns: ColumnMetadata[]) => void;
  onBack: () => void;
}

function groupByTable(
  columns: ColumnMetadata[]
): Map<string, ColumnMetadata[]> {
  const map = new Map<string, ColumnMetadata[]>();
  for (const col of columns) {
    const key = `${col.tableSchema}.${col.tableName}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(col);
  }
  return map;
}

function dataTypeBadgeColor(dataType: string): string {
  const t = dataType.toLowerCase();
  if (t.includes("int") || t.includes("numeric") || t.includes("float"))
    return "bg-chart-1/10 text-chart-1";
  if (t.includes("char") || t.includes("text") || t === "uuid")
    return "bg-chart-2/10 text-chart-2";
  if (t.includes("time") || t.includes("date"))
    return "bg-chart-3/10 text-chart-3";
  if (t.includes("bool")) return "bg-chart-4/10 text-chart-4";
  return "bg-muted text-muted-foreground";
}

export function StepSchema({
  result,
  isSaving,
  onSave,
  onBack,
}: StepSchemaProps) {
  const tableMap = result?.columns ? groupByTable(result.columns) : new Map();
  const tableNames = [...tableMap.keys()];

  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (result?.columns) {
      const initialMap = groupByTable(result.columns);
      setSelectedTables(new Set(initialMap.keys()));
    }
  }, [result]);

  const handleSave = () => {
    const selectedColumns = result?.columns?.filter((col) =>
      selectedTables.has(`${col.tableSchema}.${col.tableName}`)
    ) ?? [];
    onSave(selectedColumns);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          Schema Preview
        </h3>
        <p className="text-xs text-muted-foreground">
          Review the discovered schema before saving. This will be cached for
          AI context injection.
        </p>
      </div>

      {/* Stats strip */}
      {result?.success && (
        <div className="flex gap-4 rounded-lg border border-chart-2/20 bg-chart-2/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Table2 className="size-4 text-chart-2" />
            <span className="text-xs font-semibold text-foreground">
              {tableNames.length}
            </span>
            <span className="text-xs text-muted-foreground">tables</span>
          </div>
          <div className="flex items-center gap-2">
            <Columns3 className="size-4 text-chart-1" />
            <span className="text-xs font-semibold text-foreground">
              {result.columns.length}
            </span>
            <span className="text-xs text-muted-foreground">columns</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="size-4 text-chart-3" />
            <span className="text-xs font-semibold text-foreground">
              {result.columns.filter((c) => c.isPrimaryKey).length}
            </span>
            <span className="text-xs text-muted-foreground">primary keys</span>
          </div>
        </div>
      )}

      {/* Table explorer */}
      <div className="flex flex-col rounded-xl border border-border/40 bg-muted/10 overflow-hidden">
        {tableNames.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-muted/20">
            <button
              onClick={() => setSelectedTables(new Set(tableNames))}
              className="text-[11px] font-medium text-chart-1 hover:underline transition-colors"
            >
              Select All
            </button>
            {selectedTables.size > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {selectedTables.size} table{selectedTables.size === 1 ? "" : "s"} selected
              </span>
            )}
          </div>
        )}

        <div className="max-h-[320px] overflow-y-auto">
          {tableNames.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              {result === null ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                "No user tables found."
              )}
            </div>
          ) : (
            tableNames.map((tableFqn, tableIdx) => {
              const cols = tableMap.get(tableFqn) ?? [];
              const [schema, table] = tableFqn.split(".");
              const isSelected = selectedTables.has(tableFqn);

              return (
                <details
                  key={tableFqn}
                  open={tableIdx === 0}
                  className="group border-b border-border/30 last:border-0"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-muted/30">
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSet = new Set(selectedTables);
                          if (e.target.checked) newSet.add(tableFqn);
                          else newSet.delete(tableFqn);
                          setSelectedTables(newSet);
                        }}
                        className="size-3.5 rounded border-border/50 text-chart-1 focus:ring-chart-1/30 cursor-pointer"
                      />
                    </div>
                    <Table2 className={`size-4 shrink-0 transition-colors ${isSelected ? "text-chart-1" : "text-muted-foreground"}`} />
                    <div className={`flex flex-1 items-baseline gap-2 transition-colors ${!isSelected ? "opacity-60" : ""}`}>
                      <span className="text-xs font-semibold text-foreground">
                        {table}
                      </span>
                      {schema !== "public" && (
                        <span className="text-[10px] text-muted-foreground">
                          {schema}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {cols.length} cols
                    </span>
                  </summary>

                  {/* Column rows */}
                  <div className={`divide-y divide-border/20 pb-1 ${!isSelected ? "opacity-50" : ""}`}>
                    {cols.map((col: ColumnMetadata) => (
                      <div
                        key={col.columnName}
                        className="flex items-center gap-3 px-6 py-2 pl-10"
                      >
                        {col.isPrimaryKey ? (
                          <Key className="size-3 shrink-0 text-chart-3" />
                        ) : (
                          <div className="size-3 shrink-0" />
                        )}
                        <span className="flex-1 font-mono text-xs text-foreground">
                          {col.columnName}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${dataTypeBadgeColor(col.dataType)}`}
                        >
                          {col.dataType}
                        </span>
                        {col.isNullable && (
                          <span className="text-[10px] text-muted-foreground/60">
                            nullable
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              );
            })
          )}
        </div>

        {tableNames.length > 0 && (
          <div className="flex px-4 py-2 border-t border-border/30 bg-muted/20">
            <button
              onClick={() => setSelectedTables(new Set())}
              className="text-[11px] font-medium text-destructive hover:underline transition-colors"
            >
              Deselect All
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {result?.error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
          <p className="font-mono text-xs text-destructive/90">{result.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <Button
          id="step-schema-save"
          onClick={handleSave}
          disabled={!result?.success || isSaving || selectedTables.size === 0}
          className="flex-1 gap-2 bg-gradient-to-r from-chart-2 to-chart-1 text-white hover:brightness-110 disabled:opacity-40"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              Save & Activate Connection
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
