"use client";

import { useState } from "react";
import { Plus, Database, HelpCircle } from "lucide-react";
import Link from "next/link";
import { ConnectionsTable } from "@/components/connections/connections-table";
import { ConnectionStepper } from "@/components/connection/connection-stepper";
import type { ConnectionDetail } from "@/app/actions/ai-chat";

interface Props {
  connections: ConnectionDetail[];
}

export function ConnectionsPageClient({ connections: initial }: Props) {
  const [connections, setConnections] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);

  const handleDeleted = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaved = (updated: any) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  };

  return (
    <div className="min-h-full p-4 pt-20 md:p-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">Connections</h1>
          <p className="mt-1 text-xs md:text-sm text-white/40">
            Manage your database connections. Each connection is unique — no duplicates allowed.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Link
            href="/help"
            className="flex size-10 items-center justify-center shrink-0 rounded-full border border-white/10 bg-transparent text-white/60 hover:bg-white/5 md:size-auto md:rounded-xl md:border md:bg-white/[0.02] md:px-4 md:py-2.5 md:text-sm md:font-medium md:transition-colors hover:text-white cursor-pointer"
            title="Need Help?"
          >
            <HelpCircle className="size-4" />
            <span className="hidden md:inline">Need help?</span>
          </Link>
          <button
            id="add-connection-btn"
            onClick={() => setShowAdd(true)}
            className="flex size-10 items-center justify-center shrink-0 rounded-full border border-green-500/80 bg-transparent text-green-500 hover:bg-green-500/10 md:size-auto md:rounded-xl md:border md:border-blue-500/50 md:bg-transparent md:px-4 md:py-2.5 md:text-sm md:font-medium md:text-blue-400 md:transition-colors md:hover:bg-blue-500/10 cursor-pointer"
            title="Add Connection"
          >
            <Plus className="size-4 text-green-500 md:text-blue-400" />
            <span className="hidden md:inline">Add Connection</span>
          </button>
        </div>
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
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 md:p-5"
          >
            <p className="text-xs text-white/30">{stat.label}</p>
            <p className={`mt-1 text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <ConnectionsTable
        connections={connections}
        onDeleted={handleDeleted}
        onSaved={handleSaved}
      />

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
