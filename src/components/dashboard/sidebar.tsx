"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  Settings,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Menu,
  PanelLeftClose,
  PanelRightClose,
  Clock,
  ChevronRight,
  LogOut,
  Edit2,
  User,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useChatStore } from "@/lib/stores/chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { ChatSessionSummary } from "@/app/actions/chat-history";
import Image from "next/image";
import apiClient from "@/lib/axios";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupSessionsByDate(sessions: ChatSessionSummary[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

  const groups: { label: string; items: ChatSessionSummary[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    if (d >= todayStart) groups[0].items.push(s);
    else if (d >= yesterdayStart) groups[1].items.push(s);
    else if (d >= weekStart) groups[2].items.push(s);
    else groups[3].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------

interface AppSidebarProps {
  initialSessions?: ChatSessionSummary[];
}

export function AppSidebar({ initialSessions = [] }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isPinned, isHovered, isExpanded, togglePin, setHovered, setExpanded } = useSidebarStore();
  const expanded = mounted ? isExpanded() : false;

  const {
    sessions,
    setSessions,
    sessionsLoaded,
    activeSessionId,
    activeConnectionId,
    activeConnectionAlias,
    setActiveSession,
    createNewSession,
    removeSession,
    searchQuery,
    setSearchQuery,
    messagesBySession,
  } = useChatStore();

  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [filteredSessions, setFilteredSessions] = useState<ChatSessionSummary[]>(sessions);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  // Load initial sessions or fetch them client-side if not loaded
  useEffect(() => {
    setMounted(true);
    if (initialSessions.length > 0 && sessions.length === 0) {
      setSessions(initialSessions);
    } else if (!sessionsLoaded) {
      import("@/app/actions/chat-history").then(({ getChatSessions }) => {
        getChatSessions().then((data) => {
          setSessions(data);
        });
      });
    }
  }, [initialSessions, sessions.length, sessionsLoaded, setSessions]);

  useEffect(() => {
    setHovered(false);
    setIsUserMenuOpen(false);
  }, [pathname, setHovered]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredSessions(
        sessions.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            (s.connectionAlias ?? "").toLowerCase().includes(q)
        )
      );
    }
  }, [sessions, searchQuery]);

  const handleNewChat = useCallback(() => {
    setExpanded(true);
    if (activeConnectionId && activeConnectionAlias) {
      createNewSession(activeConnectionId, activeConnectionAlias);
      router.push("/");
    } else {
      router.push("/");
    }
  }, [activeConnectionId, activeConnectionAlias, createNewSession, router, setExpanded]);

  const handleDeleteSession = useCallback(
    async (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeletingId(sessionId);
      try {
        const { deleteChatSession } = await import("@/app/actions/chat-history");
        await deleteChatSession(sessionId);
        removeSession(sessionId);
      } finally {
        setDeletingId(null);
      }
    },
    [removeSession]
  );

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editName.trim() === user?.name) {
      setIsEditModalOpen(false);
      return;
    }
    setIsUpdatingName(true);
    try {
      const res = await apiClient.put("/auth/user", { name: editName.trim() });
      if (res.data.success && user && accessToken) {
        setAuth({ ...user, name: res.data.name }, accessToken);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to update name:", err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      // ignore
    } finally {
      logout();
      window.location.href = "/signin";
    }
  };

  const grouped = groupSessionsByDate(filteredSessions.filter(s => !s.id.startsWith("new-")));
  const COLLAPSED_W = "w-16";
  const EXPANDED_W = "w-[280px]";

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-white/[0.06] bg-[#1a1a1a] transition-all duration-300 ease-out",
        expanded ? EXPANDED_W : COLLAPSED_W
      )}
      onMouseEnter={() => !isPinned && setHovered(true)}
      onMouseLeave={() => !isPinned && setHovered(false)}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={cn("flex h-16 shrink-0 items-center px-3", expanded ? "justify-between" : "justify-center")}>
        {expanded && (
          <div className="flex items-center gap-3 pl-4 overflow-hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg overflow-hidden">
              <Image 
                src="/favicon.png" 
                alt="BI-Lite Logo" 
                width={36} 
                height={36} 
                className="object-cover"
              />
            </div>
            <span className="truncate text-base font-semibold text-white">BI-Lite</span>
          </div>
        )}

        <button
          id="sidebar-pin-btn"
          onClick={togglePin}
          className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          title={mounted && isPinned ? "Collapse sidebar" : "Pin sidebar"}
        >
          {!mounted ? (
            <Menu className="size-5 text-white/70" />
          ) : isPinned ? (
            <PanelLeftClose className="size-5 text-white/70" />
          ) : isHovered ? (
            <PanelRightClose className="size-5 text-white/70" />
          ) : (
            <Menu className="size-5 text-white/70" />
          )}
        </button>
      </div>

      {/* ── New Chat Button ─────────────────────────────────────────────── */}
      <div className="px-3 pb-2">
        <button
          id="new-chat-btn"
          onClick={handleNewChat}
          className={cn(
            "group flex w-full items-center gap-3 rounded-full py-2.5 transition-colors hover:bg-white/10",
            expanded ? "px-4" : "justify-center px-0"
          )}
        >
          <Plus className="size-5 shrink-0 text-white/80 group-hover:text-white" />
          {expanded && (
            <span className="text-sm font-medium text-white/80 group-hover:text-white">
              New chat
            </span>
          )}
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 ring-1 ring-white/[0.05] transition-all focus-within:ring-white/20">
            <Search className="size-4 shrink-0 text-white/40" />
            <input
              ref={searchRef}
              id="chat-search-input"
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-white/80 placeholder-white/30 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="shrink-0 text-white/30 hover:text-white/60"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {!expanded && (
        <div className="px-3 pb-2">
          <button
            onClick={() => {
              togglePin();
              setTimeout(() => searchRef.current?.focus(), 300);
            }}
            className="flex w-full items-center justify-center rounded-full py-2.5 transition-colors hover:bg-white/10"
          >
            <Search className="size-5 text-white/60" />
          </button>
        </div>
      )}

      {/* ── Chat History ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
        {expanded ? (
          grouped.length > 0 ? (
            grouped.map((group) => (
              <div key={group.label} className="mb-2">
                <p className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-white/30">
                  {group.label}
                </p>
                {group.items.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const msgCount =
                    messagesBySession[session.id]?.length ?? session.messageCount ?? 0;
                  return (
                    <div
                      key={session.id}
                      id={`chat-session-${session.id}`}
                      onClick={() => {
                        setExpanded(true);
                        setActiveSession(session.id);
                        if (session.connectionId && activeConnectionId !== session.connectionId) {
                          useChatStore.getState().setActiveConnection(
                            session.connectionId,
                            session.connectionAlias ?? "Deleted DB"
                          );
                        } else if (!session.connectionId) {
                          useChatStore.getState().clearActiveConnection();
                        }
                        router.push(`/chat/${session.id}`);
                      }}
                      className={cn(
                        "group relative mx-2 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition-all",
                        isActive
                          ? "bg-white/[0.12] text-white"
                          : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                      )}
                    >
                      <MessageSquare className="size-4 shrink-0 opacity-60" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm leading-tight">{session.title}</p>
                        {session.connectionAlias && (
                          <p className="truncate text-[10px] text-white/30">
                            {session.connectionAlias}
                          </p>
                        )}
                      </div>
                      {msgCount > 0 && (
                        <span className="shrink-0 text-[10px] text-white/20">{msgCount}</span>
                      )}
                      <button
                        id={`delete-session-${session.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete({ id: session.id, title: session.title });
                        }}
                        className="absolute right-2 hidden shrink-0 rounded p-0.5 text-white/30 hover:text-red-400 group-hover:flex"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Clock className="size-8 text-white/20" />
              <p className="text-xs text-white/30">
                {searchQuery ? "No chats found" : "No chat history yet"}
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            {sessions.filter(s => !s.id.startsWith("new-")).slice(0, 8).map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <button
                  key={session.id}
                  onClick={() => {
                    setExpanded(true);
                    setActiveSession(session.id);
                    router.push(`/chat/${session.id}`);
                  }}
                  title={session.title}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                    isActive ? "bg-white/[0.12] text-white" : "text-white/50 hover:bg-white/10"
                  )}
                >
                  <MessageSquare className="size-5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Delete Chat?</h3>
            <p className="mt-2 text-sm text-white/50">
              Are you sure you want to delete <span className="font-medium text-white/80">"{sessionToDelete.title}"</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSessionToDelete(null)}
                disabled={deletingId !== null}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  handleDeleteSession(sessionToDelete.id, e as any);
                  setSessionToDelete(null);
                }}
                disabled={deletingId !== null}
                className="flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {deletingId === sessionToDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <div className="mt-auto shrink-0 border-t border-white/[0.06] px-3 py-3">
        {[
          { label: "Dashboard", icon: <LayoutDashboard className="size-5" />, href: "/dashboard" },
          { label: "Connections", icon: <Database className="size-5" />, href: "/connections" },
          { label: "Settings", icon: <Settings className="size-5" />, href: "" },
        ].map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              onClick={() => {
                if (item.href) {
                  setExpanded(true);
                  router.push(item.href);
                }
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl py-2.5 transition-colors",
                expanded ? "px-3" : "justify-center px-0",
                isActive
                  ? "bg-white/[0.12] text-white"
                  : "text-white/40 hover:bg-white/[0.08] hover:text-white/80"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              {expanded && <span className="text-sm">{item.label}</span>}
              {expanded && isActive && (
                <ChevronRight className="ml-auto size-3.5 text-white/30" />
              )}
            </button>
          );
        })}

        {/* User profile card & menu */}
        <div className="relative mt-2" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/10",
              !expanded && "justify-center px-0",
              isUserMenuOpen && "bg-white/10"
            )}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white uppercase">
              {user?.name?.[0] || "U"}
            </div>
            {expanded && (
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-white/80">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-white/30">
                  User
                </p>
              </div>
            )}
          </button>

          {/* User Popover Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full animate-in fade-in slide-in-from-bottom-2 z-50">
              <div className="rounded-xl border border-white/10 bg-[#252525] p-1 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between px-2 py-1.5 group cursor-default">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <User className="size-4 shrink-0 text-white/50" />
                    <span className="truncate text-sm font-medium text-white/90">
                      {user?.name || "User"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditName(user?.name || "");
                      setIsEditModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="flex shrink-0 items-center justify-center rounded p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                    title="Edit Name"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                </div>
                
                <div className="my-1 h-px bg-white/10" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-400 transition-colors hover:bg-white/5 hover:text-red-300"
                >
                  <LogOut className="size-4 shrink-0" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Name Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
            
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white uppercase">
                {user?.name?.[0] || "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user?.email}</p>
                <p className="truncate text-xs text-white/50">Role: User</p>
              </div>
            </div>

            <form onSubmit={handleUpdateName} className="mt-5">
              <label htmlFor="name" className="block text-xs font-medium text-white/60 mb-1.5">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder="Enter your name"
                required
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdatingName}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingName || !editName.trim()}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                  {isUpdatingName ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
