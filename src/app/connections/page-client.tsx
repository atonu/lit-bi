"use client";

import { useState } from "react";
import { Plus, Database } from "lucide-react";
import { ConnectionsTable } from "@/components/connections/connections-table";
import { ConnectionStepper } from "@/components/connection/connection-stepper";
import type { ConnectionDetail } from "@/app/actions/ai-chat";

interface Props {
  connections: ConnectionDetail[];
}

export function ConnectionsPageClient({ connections: initial }: Props) {
  const [connections, setConnections] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="min-h-full p-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Connections</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage your database connections. Each connection is unique — no duplicates allowed.
          </p>
        </div>
        <button
          id="add-connection-btn"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-500/80 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <Plus className="size-4" />
          Add Connection
        </button>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: connections.length, color: "text-white/70" },
          { label: "Connected", value: connections.filter((c) => c.status === "CONNECTED").length, color: "text-green-400" },
          { label: "Failed", value: connections.filter((c) => c.status === "FAILED").length, color: "text-red-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <p className="text-xs text-white/30">{stat.label}</p>
            <p className={`mt-1 text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <ConnectionsTable connections={connections} />

      {/* Add connection modal */}
      {showAdd && (
        <ConnectionStepper
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            // Reload the page to get fresh data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
