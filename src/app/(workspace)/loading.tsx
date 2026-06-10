import { Sparkles, Database } from "lucide-react";

export default function WorkspaceLoading() {
  return (
    <div className="flex flex-1 flex-col bg-[#131314]">
      {/* Messages area placeholder */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          
          {/* User Message Bubble Placeholder */}
          <div className="flex items-end justify-end gap-3">
            <div className="max-w-[60%] rounded-2xl rounded-br-sm bg-white/[0.04] px-5 py-3 ring-1 ring-white/[0.05] space-y-2">
              <div className="h-3.5 w-48 animate-pulse rounded bg-white/10" />
              <div className="h-3.5 w-32 animate-pulse rounded bg-white/10" />
            </div>
            <div className="size-8 shrink-0 animate-pulse rounded-full bg-white/10" />
          </div>

          {/* Assistant Message Bubble Placeholder */}
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
              <Sparkles className="size-4 animate-pulse text-blue-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-4 w-1/4 animate-pulse rounded bg-white/10" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-white/10" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
              </div>

              {/* Chart area skeleton placeholder */}
              <div className="mt-4 h-56 w-full animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-36 rounded bg-white/10" />
                  <div className="h-6 w-24 rounded bg-white/10" />
                </div>
                <div className="flex items-end gap-3 h-28 px-4">
                  {[35, 55, 45, 75, 60, 90, 80, 100, 85].map((h, i) => (
                    <div 
                      key={i} 
                      className="flex-1 animate-pulse bg-white/5 rounded-t-sm" 
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="h-3 w-48 rounded bg-white/15" />
              </div>
            </div>
          </div>

          {/* User Message Bubble Placeholder 2 */}
          <div className="flex items-end justify-end gap-3">
            <div className="max-w-[40%] rounded-2xl rounded-br-sm bg-white/[0.04] px-5 py-3 ring-1 ring-white/[0.05]">
              <div className="h-3.5 w-28 animate-pulse rounded bg-white/10" />
            </div>
            <div className="size-8 shrink-0 animate-pulse rounded-full bg-white/10" />
          </div>

          {/* Assistant Thinking/Loading Indicator Placeholder */}
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
              <Sparkles className="size-4 animate-pulse text-blue-400" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="size-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                <div className="h-3.5 w-48 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom input area placeholder */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#131314] px-4 py-4">
        <div className="mx-auto max-w-3xl">
          {/* Connection Selector Pill skeleton */}
          <div className="mb-3">
            <div className="flex h-7 w-48 animate-pulse items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3">
              <Database className="size-3.5 text-blue-400/50" />
              <div className="h-2.5 w-24 rounded bg-white/10" />
            </div>
          </div>

          {/* Input box skeleton */}
          <div className="h-16 w-full animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />

          <div className="mt-2 flex justify-center">
            <div className="h-2.5 w-56 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
