"use client";

import { useState } from "react";
import { Database, Plus, RefreshCw, Activity } from "lucide-react";
import type { ConnectionSummary } from "@/app/actions/ai-chat";
import { ConnectionStepper } from "@/components/connection/connection-stepper";

interface ConnectedDashboardProps {
  connections: ConnectionSummary[];
}

export function ConnectedDashboard({ connections }: ConnectedDashboardProps) {
  const [activeConn, setActiveConn] = useState<ConnectionSummary>(
    connections[0]
  );
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Connected to{" "}
            <span className="font-medium text-chart-1">{activeConn.alias}</span>{" "}
            · {activeConn.host}/{activeConn.dbName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection switcher when multiple connections exist */}
          {connections.length > 1 && (
            <select
              value={activeConn.id}
              onChange={(e) => {
                const found = connections.find((c) => c.id === e.target.value);
                if (found) setActiveConn(found);
              }}
              className="rounded-lg border border-border/40 bg-card/50 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-chart-1/50"
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.alias}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-chart-1/30 hover:bg-chart-1/5 hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add Connection
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-chart-2/20 bg-chart-2/5 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-2/10">
            <Database className="size-5 text-chart-2" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <p className="text-sm font-semibold text-chart-2">Connected</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-chart-1/20 bg-chart-1/5 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-1/10">
            <Activity className="size-5 text-chart-1" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Engine
            </p>
            <p className="text-sm font-semibold text-foreground">
              {activeConn.engine === "POSTGRESQL" ? "PostgreSQL" : "MySQL"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-chart-5/20 bg-chart-5/5 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-5/10">
            <RefreshCw className="size-5 text-chart-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Database
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {activeConn.dbName}
            </p>
          </div>
        </div>
      </div>

      {/* Call-to-action panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-border/40 bg-card/20 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-1/10 to-chart-5/10 ring-1 ring-chart-1/20">
          <span className="text-3xl">✨</span>
        </div>
        <div className="max-w-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Ask your data a question
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the <span className="font-medium text-chart-1">AI Chat</span>{" "}
            panel on the right to start querying{" "}
            <span className="font-medium">{activeConn.alias}</span> in plain
            English. The AI will write the SQL, run it securely, and render the
            best chart automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-chart-1/20 bg-chart-1/5 px-4 py-2 text-xs text-chart-1">
          <span className="size-1.5 rounded-full bg-chart-2 animate-pulse" />
          Try: "Show me all records in my largest table"
        </div>
      </div>

      {/* Add connection modal */}
      {addOpen && (
        <ConnectionStepper
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setAddOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
