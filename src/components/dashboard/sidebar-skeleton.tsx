import { MessageSquare, Plus, Search, LayoutDashboard, Database, Settings } from "lucide-react";

export function SidebarSkeleton() {
  return (
    <aside className="hidden w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-[#1a1a1a] sm:flex">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-2 pl-4">
          <div className="size-7 animate-pulse rounded-lg bg-white/10" />
          <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
        </div>
        <div className="size-10 animate-pulse rounded-full bg-white/5" />
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <div className="flex h-10 w-full animate-pulse items-center gap-3 rounded-full bg-white/[0.04] px-4">
          <Plus className="size-5 text-white/20" />
          <div className="h-3.5 w-16 rounded bg-white/10" />
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2">
        <div className="flex h-10 w-full animate-pulse items-center gap-2 rounded-full bg-white/[0.02] px-3 border border-white/[0.05]">
          <Search className="size-4 text-white/20" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
      </div>

      {/* Chat History Skeleton */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {/* Today Group */}
        <div className="mb-6">
          <div className="mx-2 mb-2 h-2.5 w-12 animate-pulse rounded bg-white/10" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-10 items-center gap-2 rounded-xl px-3">
              <MessageSquare className="size-4 shrink-0 text-white/10" />
              <div className="flex-1 space-y-2">
                <div 
                  className="h-3 animate-pulse rounded bg-white/10" 
                  style={{ width: i === 1 ? "70%" : i === 2 ? "55%" : "80%" }} 
                />
                <div className="h-2 w-20 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>

        {/* Yesterday Group */}
        <div>
          <div className="mx-2 mb-2 h-2.5 w-16 animate-pulse rounded bg-white/10" />
          {[1, 2].map((i) => (
            <div key={i} className="flex h-10 items-center gap-2 rounded-xl px-3">
              <MessageSquare className="size-4 shrink-0 text-white/10" />
              <div className="flex-1 space-y-2">
                <div 
                  className="h-3 animate-pulse rounded bg-white/10" 
                  style={{ width: i === 1 ? "65%" : "75%" }} 
                />
                <div className="h-2 w-16 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav Skeleton */}
      <div className="mt-auto shrink-0 border-t border-white/[0.06] px-3 py-3 space-y-1">
        {[
          { label: "Dashboard", icon: <LayoutDashboard className="size-5 text-white/20" /> },
          { label: "Connections", icon: <Database className="size-5 text-white/20" /> },
          { label: "Settings", icon: <Settings className="size-5 text-white/20" /> }
        ].map((item, index) => (
          <div
            key={index}
            className="flex h-10 items-center gap-3 rounded-xl px-3"
          >
            {item.icon}
            <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          </div>
        ))}

        {/* User profile */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="size-8 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-2.5 w-10 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      </div>
    </aside>
  );
}
