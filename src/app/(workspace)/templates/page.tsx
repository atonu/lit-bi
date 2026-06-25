"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X, Sparkles, Form } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

const TEST_USER_EMAIL = "test@yopmail.com";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

interface Template {
  id: string;
  text: string;
  createdAt: string;
}

function getToken(): string | null {
  try {
    const authRaw = localStorage.getItem("auth-storage");
    if (!authRaw) return null;
    const authData = JSON.parse(authRaw);
    return authData?.state?.accessToken || null;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  return res;
}

export default function TemplatesPage() {
  const user = useAuthStore((s) => s.user);
  const isTestUser = user?.email === TEST_USER_EMAIL;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newText, setNewText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/templates");
      if (!res.ok) throw new Error("Failed to load templates.");
      const data: Template[] = await res.json();
      setTemplates(data);
    } catch (e: any) {
      setError(e.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isTestUser) {
      loadTemplates();
    } else {
      setLoading(false);
    }
  }, [isTestUser]);

  const handleCreate = () => {
    const text = newText.trim();
    if (!text) return;
    startTransition(async () => {
      try {
        const res = await apiFetch("/api/templates", {
          method: "POST",
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("Failed to create template.");
        setNewText("");
        await loadTemplates();
      } catch (e: any) {
        setError(e.message || "Failed to create template.");
      }
    });
  };

  const handleUpdate = (id: string) => {
    const text = editText.trim();
    if (!text) return;
    startTransition(async () => {
      try {
        const res = await apiFetch(`/api/templates/${id}`, {
          method: "PUT",
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("Failed to update template.");
        setEditingId(null);
        await loadTemplates();
      } catch (e: any) {
        setError(e.message || "Failed to update template.");
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await apiFetch(`/api/templates/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete template.");
        setDeletingId(null);
        await loadTemplates();
      } catch (e: any) {
        setError(e.message || "Failed to delete template.");
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#080310] min-h-screen">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20">
          <Form className="size-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">Prompt Templates</h1>
          <p className="text-xs text-white/40">Save frequently-used questions as one-click suggestions in the chat.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl w-full mx-auto">
        {isTestUser ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <Sparkles className="size-6 text-white/30" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/60">Templates are not available for the demo account.</p>
              <p className="mt-1 text-xs text-white/30">The demo account uses a fixed set of default suggestions.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Add new template */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">
                Add New Template
              </label>
              <div className="flex gap-2">
                <textarea
                  id="new-template-input"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                  placeholder="e.g. Show monthly revenue trends for 2026"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-primary/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/20"
                />
                <button
                  id="add-template-btn"
                  onClick={handleCreate}
                  disabled={!newText.trim() || isPending}
                  className="flex shrink-0 items-center gap-1.5 self-end rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="size-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Template list */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <Form className="size-5 text-white/20" />
                </div>
                <p className="text-sm text-white/30">No templates yet. Add one above to get started.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/[0.10] hover:bg-white/[0.05]"
                  >
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-primary/60" />

                    {editingId === t.id ? (
                      <div className="flex flex-1 flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          autoFocus
                          className="w-full resize-none rounded-lg border border-primary/30 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(t.id)}
                            disabled={!editText.trim() || isPending}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-40"
                          >
                            <Check className="size-3" /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 text-xs text-white/40 transition hover:text-white/70"
                          >
                            <X className="size-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-sm text-white/70 leading-relaxed">{t.text}</p>
                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => { setEditingId(t.id); setEditText(t.text); }}
                            className="flex size-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/[0.08] hover:text-white/70 transition-colors"
                            title="Edit template"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deletingId === t.id || isPending}
                            className="flex size-7 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40"
                            title="Delete template"
                          >
                            {deletingId === t.id ? (
                              <div className="size-3 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white/80" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
