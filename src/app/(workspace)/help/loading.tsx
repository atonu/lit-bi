export default function LoadingHelp() {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#131314]">
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden text-foreground">
        <div className="mx-auto flex w-full max-w-7xl px-4 pt-20 pb-24 md:pt-14 md:pb-20 lg:px-8 gap-0 lg:gap-12">
          
          {/* LEFT / MAIN CONTENT */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-0">
            
            {/* HERO SKELETON */}
            <div className="relative overflow-hidden rounded-3xl mb-12 min-h-[340px] flex flex-col justify-end p-8 md:p-12 border border-white/5 bg-white/[0.02]">
              <div className="space-y-3">
                <div className="h-6 w-32 animate-pulse rounded-full bg-white/10" />
                <div className="h-12 w-64 animate-pulse rounded bg-white/20" />
                <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/5" />
                <div className="h-4 w-72 max-w-full animate-pulse rounded bg-white/5" />
              </div>
            </div>

            <hr className="border-white/[0.06] mb-12" />

            {/* SECTION SKELETON 1 */}
            <div className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10 border border-white/5 bg-white/[0.02]">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="size-8 animate-pulse rounded-lg bg-white/10" />
                  <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-[90%] animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-[80%] animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-[85%] animate-pulse rounded bg-white/5" />
                </div>
              </div>
            </div>

            <hr className="border-white/[0.06] mb-12" />

            {/* SECTION SKELETON 2 */}
            <div className="relative overflow-hidden rounded-2xl mb-12 p-8 md:p-10 border border-white/5 bg-white/[0.02]">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="size-8 animate-pulse rounded-lg bg-white/10" />
                  <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-[75%] animate-pulse rounded bg-white/5" />
                </div>
                <div className="mt-6 grid gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <div className="size-6 shrink-0 animate-pulse rounded-full bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                        <div className="h-3 w-full animate-pulse rounded bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Index Panel */}
          <div className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-14 space-y-5">
              <div className="border-l border-white/8 pl-5 space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-2 w-24 animate-pulse rounded bg-white/5" />
              </div>

              <div className="flex flex-col gap-3 pl-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-4 w-full animate-pulse rounded bg-white/5" />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
