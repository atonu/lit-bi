"use client";

import { useState } from "react";
import {
  Database,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Server,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionDetail } from "@/app/actions/ai-chat";
import { ConnectionEditModal } from "./connection-edit-modal";

// ---------------------------------------------------------------------------
// Engine icon helper
// ---------------------------------------------------------------------------

function EngineIcon({ engine }: { engine: string }) {
  if (engine === "MONGODB") return <Leaf className="size-4 text-green-400" />;
  if (engine === "MYSQL") return <Database className="size-4 text-orange-400" />;
  return <Server className="size-4 text-blue-400" />;
}

function engineLabel(engine: string) {
  if (engine === "POSTGRESQL") return "PostgreSQL";
  if (engine === "MYSQL") return "MySQL";
  if (engine === "MONGODB") return "MongoDB";
  return engine;
}

function statusLabel(status: string) {
  if (status === "CONNECTED") return "Successful";
  if (status === "FAILED") return "Failed";
  if (status === "REVOKED") return "Revoked";
  if (status === "PENDING") return "Pending";
  return status;
}



function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// ConnectionsTable
// ---------------------------------------------------------------------------

interface ConnectionsTableProps {
  connections: ConnectionDetail[];
}

export function ConnectionsTable({ connections: initial }: ConnectionsTableProps) {
  const [connections, setConnections] = useState(initial);
  const [editingConn, setEditingConn] = useState<ConnectionDetail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { deleteConnection } = await import("@/app/actions/connection");
      const { toast } = await import("sonner");
      const res = await deleteConnection(id);
      if (res.success) {
        setConnections((prev) => prev.filter((c) => c.id !== id));
        toast.success("Connection deleted.");
      } else {
        toast.error(res.error || "Failed to delete connection.");
      }
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
        <Database className="size-12 text-white/10" />
        <p className="mt-4 text-sm font-medium text-white/40">No connections yet</p>
        <p className="mt-1 text-xs text-white/25">Add a database connection to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Alias", "Engine", "Host / Database", "Status", "Created", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-white/30"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {connections.map((conn, i) => (
              <tr
                key={conn.id}
                id={`conn-row-${conn.id}`}
                className={cn(
                  "group transition-colors hover:bg-white/[0.03]",
                  i < connections.length - 1 && "border-b border-white/[0.04]"
                )}
              >
                {/* Alias */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                      <EngineIcon engine={conn.engine} />
                    </div>
                    <span className="font-medium text-white/90">{conn.alias}</span>
                  </div>
                </td>

                {/* Engine */}
                <td className="px-5 py-4">
                  <span className="text-white/50">{engineLabel(conn.engine)}</span>
                </td>

                {/* Host / DB */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    {conn.host && (
                      <span className="flex items-center gap-1.5 text-white/60">
                        <ExternalLink className="size-3 text-white/20" />
                        {conn.host}
                        {conn.port ? `:${conn.port}` : ""}
                      </span>
                    )}
                    {conn.dbName && (
                      <span className="text-xs text-white/35">{conn.dbName}</span>
                    )}
                    {conn.dbUser && (
                      <span className="text-xs text-white/25">{conn.dbUser}</span>
                    )}
                    {!conn.host && !conn.dbName && (
                      <span className="text-xs text-white/30">MongoDB Atlas URI</span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-5 py-4 text-white/50">
                  {statusLabel(conn.status)}
                </td>

                {/* Created */}
                <td className="px-5 py-4 text-xs text-white/35">
                  {formatDate(conn.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      id={`edit-conn-${conn.id}`}
                      onClick={() => setEditingConn(conn)}
                      className="flex size-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white/70"
                      title="Edit connection"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      id={`delete-conn-${conn.id}`}
                      onClick={() => setShowDeleteConfirm(conn.id)}
                      className="flex size-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Delete connection"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-slide-up w-full max-w-sm rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Delete connection?</h3>
            <p className="mt-2 text-sm text-white/50">
              This will permanently remove the connection and all associated schema metadata.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={!!deletingId}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={!!deletingId}
                className="flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {deletingId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingConn && (
        <ConnectionEditModal
          connection={editingConn}
          onClose={() => setEditingConn(null)}
          onSaved={(updated) => {
            setConnections((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            );
            setEditingConn(null);
          }}
        />
      )}
    </>
  );
}
