import { Loader2 } from "lucide-react";
import { SidebarSkeleton } from "@/components/dashboard/sidebar-skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#131314]">
      <SidebarSkeleton />

      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white/50">
          <Loader2 className="size-8 animate-spin text-blue-500/80" />
          <p className="text-sm">Loading BI-Lite...</p>
        </div>
      </div>
    </div>
  );
}
