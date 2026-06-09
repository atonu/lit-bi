"use client";

import { useState } from "react";
import { Database, Plus, RefreshCw, Activity, ExternalLink, CheckCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import type { ConnectionDetail } from "@/app/actions/ai-chat";
import { ConnectionStepper } from "@/components/connection/connection-stepper";

interface ConnectedDashboardProps {
  connections: ConnectionDetail[];
}

export function ConnectedDashboard({ connections }: ConnectedDashboardProps) {
  const [activeConn, setActiveConn] = useState<ConnectionDetail | null>(
    connections.length > 0 ? connections[0] : null
  );
  const [addOpen, setAddOpen] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  if (connections.length === 0 || !activeConn) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-6 pt-20 md:p-6 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
          <Database className="size-8 text-white/20" />
        </div>
        <h2 className="text-xl font-semibold text-white">No Database Connected</h2>
        <p className="mt-2 text-sm text-white/40">
          Connect your database to start analyzing your data.
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="mt-6 flex items-center gap-2 rounded-xl border border-blue-500/50 bg-transparent px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/10 cursor-pointer"
        >
          <Plus className="size-4 text-blue-400" />
          Add Connection
        </button>
        {addOpen && (
          <ConnectionStepper
            onClose={() => setAddOpen(false)}
            onSuccess={() => window.location.reload()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-6 p-4 pt-20 md:p-8">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-white">Dashboard Overview</h2>
          <p className="mt-1 text-xs md:text-sm text-white/40">
            Connected to{" "}
            <span className="font-medium text-white/90">{activeConn.alias}</span>{" "}
            · {activeConn.host ? `${activeConn.host}/${activeConn.dbName}` : 'MongoDB Atlas'}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Connection switcher */}
          {connections.length > 1 && (
            <select
              value={activeConn.id}
              onChange={(e) => {
                const found = connections.find((c) => c.id === e.target.value);
                if (found) setActiveConn(found);
              }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-2.5 md:px-4 py-2 text-xs md:text-sm text-white/80 outline-none transition-all hover:bg-white/[0.06] focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 max-w-[120px] md:max-w-none"
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1e1e1e] text-white">
                  {c.alias}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setAddOpen(true)}
            className="flex size-10 items-center justify-center shrink-0 rounded-full border border-green-500/80 bg-transparent text-green-500 hover:bg-green-500/10 md:size-auto md:rounded-xl md:border md:border-blue-500/50 md:bg-transparent md:px-4 md:py-2 md:text-sm md:font-medium md:text-blue-400 transition-all md:hover:bg-blue-500/10 cursor-pointer"
            title="Add Connection"
          >
            <Plus className="size-4 text-green-500 md:text-blue-400" />
            <span className="hidden md:inline">Add Connection</span>
          </button>
          <button
            onClick={() => setShowConfirmDisconnect(true)}
            className="flex size-10 items-center justify-center shrink-0 rounded-full border border-red-500/80 bg-transparent text-red-500 hover:bg-red-500/10 md:size-auto md:rounded-xl md:border md:border-red-500/50 md:bg-transparent md:px-4 md:py-2 md:text-sm md:font-medium md:text-red-400 transition-all md:hover:bg-red-500/10 cursor-pointer"
            title="Disconnect"
          >
            <Trash2 className="size-4 md:hidden block text-red-500" />
            <span className="hidden md:inline">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Database Name */}
        <div className="flex items-center gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
            <Database className="size-6 text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400/50">
              Database Name
            </p>
            <p className="mt-0.5 truncate text-lg font-semibold text-white/90">
              {activeConn.dbName || "Default"}
            </p>
          </div>
        </div>

        {/* Engine */}
        <div className="flex items-center gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <Activity className="size-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400/50">
              Engine
            </p>
            <p className="mt-0.5 text-lg font-semibold text-white/90">
              {activeConn.engine === "POSTGRESQL" ? "PostgreSQL" : 
               activeConn.engine === "MYSQL" ? "MySQL" : "MongoDB"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
            <CheckCircle className="size-6 text-green-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-green-400/50">
              Status
            </p>
            <p className="mt-0.5 text-lg font-semibold text-green-400">Connected</p>
          </div>
        </div>
      </div>

      {/* Call-to-action panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl overflow-hidden">
          <Image 
            src="/favicon.png" 
            alt="BI-Lite Logo" 
            width={80} 
            height={80} 
            className="object-cover"
          />
        </div>
        <div className="max-w-md">
          <h3 className="text-xl font-semibold text-white">
            Ready to explore {activeConn.alias}?
          </h3>
          <p className="mt-3 text-sm text-white/50">
            Head over to the <span className="font-medium text-blue-400">Chat</span> view to ask questions about your data in plain English. The AI will write the queries and build beautiful charts for you automatically.
          </p>
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

      {/* Disconnect Confirmation Modal */}
      {showConfirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-slide-up w-full max-w-sm rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Disconnect Database?</h3>
            <p className="mt-2 text-sm text-white/50">
              Are you sure you want to disconnect <span className="font-medium text-white/80">{activeConn.alias}</span>? This will remove all associated schema metadata. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDisconnect(false)}
                disabled={isDisconnecting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDisconnecting(true);
                  try {
                    const { deleteConnection } = await import("@/app/actions/connection");
                    const { toast } = await import("sonner");
                    const res = await deleteConnection(activeConn.id);
                    if (res.success) {
                      toast.success("Disconnected successfully.");
                      window.location.reload();
                    } else {
                      toast.error(res.error || "Failed to disconnect.");
                      setIsDisconnecting(false);
                    }
                  } catch (e) {
                    console.error(e);
                    setIsDisconnecting(false);
                  }
                }}
                disabled={isDisconnecting}
                className="flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
