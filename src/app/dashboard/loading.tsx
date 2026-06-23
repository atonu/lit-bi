import { SidebarSkeleton } from "@/components/dashboard/sidebar-skeleton";

export default function LoadingDashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#080310]">
      <SidebarSkeleton />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-2 h-8 w-64 animate-pulse rounded-lg bg-white/10" />
            <div className="h-4 w-48 animate-pulse rounded bg-white/5" />
          </div>
          <div className="hidden md:flex gap-3">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-white/[0.05]" />
            <div className="h-10 w-32 animate-pulse rounded-xl bg-white/[0.05]" />
          </div>
        </div>

        {/* Status Cards Skeleton */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="size-12 shrink-0 animate-pulse rounded-xl bg-white/10" />
              <div className="flex-1">
                <div className="mb-2 h-3 w-16 animate-pulse rounded bg-white/5" />
                <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Panel Skeleton */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
          <div className="size-20 animate-pulse rounded-3xl bg-white/10" />
          <div className="h-6 w-64 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-96 animate-pulse rounded bg-white/5" />
        </div>
      </main>
    </div>
  );
}
