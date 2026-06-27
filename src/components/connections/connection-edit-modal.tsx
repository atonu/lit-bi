"use client";

import { useState } from "react";
import { X, Save, Copy, Check } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-white/30 hover:text-white/70 transition-colors focus:outline-none shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="size-3 text-green-400" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}
import { cn } from "@/lib/utils";
import type { ConnectionDetail } from "@/app/actions/ai-chat";

interface ConnectionEditModalProps {
  connection: ConnectionDetail;
  onClose: () => void;
  onSaved: (updated: Partial<ConnectionDetail> & { id: string }) => void;
}

export function ConnectionEditModal({
  connection,
  onClose,
  onSaved,
}: ConnectionEditModalProps) {
  const [alias, setAlias] = useState(connection.alias);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!alias.trim()) {
      setError("Alias cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { updateConnectionAlias } = await import("@/app/actions/connection");
      const res = await updateConnectionAlias(connection.id, alias.trim());
      if (res.success) {
        const { toast } = await import("sonner");
        toast.success("Connection updated.");
        onSaved({ id: connection.id, alias: alias.trim() });
      } else {
        setError(res.error || "Failed to update.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  };

  const connectionString =
    connection.connectionString ||
    (connection.engine === "MONGODB"
      ? `mongodb+srv://****@${connection.host || "..."}/${connection.dbName || ""}`
      : `${connection.engine === "MYSQL" ? "mysql" : "postgresql"}://${connection.dbUser ? `${connection.dbUser}:****@` : ""}${connection.host || "localhost"}${connection.port ? `:${connection.port}` : ""}/${connection.dbName || ""}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-slide-up w-full max-w-md rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Edit Connection</h3>
            <p className="mt-0.5 text-xs text-white/40">
              Update the display name for this connection.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white/70"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Connection info (read-only) */}
        <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="min-w-0">
              <p className="text-white/30">Engine</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="font-medium text-white/70 truncate flex-1 block">
                  {connection.engine}
                </span>
                <CopyButton text={connection.engine} />
              </div>
            </div>
            {connection.host && (
              <div className="min-w-0">
                <p className="text-white/30">Host</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-medium text-white/70 truncate flex-1 block">
                    {connection.host}{connection.port ? `:${connection.port}` : ""}
                  </span>
                  <CopyButton text={`${connection.host}${connection.port ? `:${connection.port}` : ""}`} />
                </div>
              </div>
            )}
            {connection.dbName && (
              <div className="min-w-0">
                <p className="text-white/30">Database</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-medium text-white/70 truncate flex-1 block">
                    {connection.dbName}
                  </span>
                  <CopyButton text={connection.dbName} />
                </div>
              </div>
            )}
            {connection.dbUser && (
              <div className="min-w-0">
                <p className="text-white/30">User</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-medium text-white/70 truncate flex-1 block">
                    {connection.dbUser}
                  </span>
                  <CopyButton text={connection.dbUser} />
                </div>
              </div>
            )}
            <div className="col-span-2 min-w-0">
              <p className="text-white/30">Connection String</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="font-medium text-white/70 truncate flex-1 block font-mono text-[10px]">
                  {connectionString}
                </span>
                <CopyButton text={connectionString} />
              </div>
            </div>
          </div>
        </div>

        {/* Editable alias */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Display Name (Alias)
          </label>
          <input
            id="edit-conn-alias"
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className={cn(
              "w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 outline-none transition-all placeholder:text-white/20",
              error
                ? "border-red-500/50 ring-1 ring-red-500/20"
                : "border-white/10 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
            )}
            placeholder="e.g. Production DB"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            id="save-conn-btn"
            onClick={handleSave}
            disabled={saving || !alias.trim()}
            className="flex items-center gap-2 rounded-xl bg-blue-500/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            <Save className="size-3.5" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
