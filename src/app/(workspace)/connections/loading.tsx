export default function LoadingConnections() {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-white/10" />
          <div className="h-4 w-96 animate-pulse rounded bg-white/5" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-xl bg-blue-500/20" />
      </div>

      {/* Stats Row Skeleton */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-2 h-3 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-8 w-12 animate-pulse rounded bg-white/20" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-4 h-6 w-full animate-pulse rounded bg-white/5" />
        <div className="mb-2 h-12 w-full animate-pulse rounded bg-white/[0.03]" />
        <div className="mb-2 h-12 w-full animate-pulse rounded bg-white/[0.03]" />
        <div className="h-12 w-full animate-pulse rounded bg-white/[0.03]" />
      </div>
    </main>
  );
}
