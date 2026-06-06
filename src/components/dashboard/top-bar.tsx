"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Search, Sparkles } from "lucide-react";
import { ConnectionStepper } from "@/components/connection/connection-stepper";
import { useChatStore } from "@/lib/stores/chat-store";
import { getConnections } from "@/app/actions/ai-chat";

export function TopBar() {
  const [open, setOpen] = useState(false);
  const { setActiveConnection } = useChatStore();

  async function handleSearchClick() {
    const conns = await getConnections();
    if (conns.length > 0) {
      setActiveConnection(conns[0].id, conns[0].alias);
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-sm">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <span className="rounded-md bg-chart-1/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chart-1">
            Overview
          </span>
        </div>

        {/* Right: Search + CTAs */}
        <div className="flex items-center gap-3">
          {/* Search — clicks open AI chat */}
          <button
            onClick={handleSearchClick}
            className="group relative flex h-9 w-64 cursor-pointer items-center rounded-lg border border-border/50 bg-muted/30 px-3 text-left transition-all hover:border-chart-1/40 hover:bg-chart-1/5"
          >
            <Search className="mr-2 size-4 text-muted-foreground/50 group-hover:text-chart-1/60" />
            <span className="flex-1 text-sm text-muted-foreground/50 group-hover:text-muted-foreground">
              Ask a question…
            </span>
            <span className="ml-2 hidden rounded border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50 sm:block">
              AI
            </span>
          </button>

          {/* Primary CTA */}
          <Button
            id="topbar-connect-database"
            onClick={() => setOpen(true)}
            size="default"
            className="gap-2 bg-gradient-to-r from-chart-1 to-chart-5 text-white shadow-lg shadow-chart-1/20 transition-all hover:shadow-xl hover:shadow-chart-1/30 hover:brightness-110"
          >
            <Database className="size-4" />
            Connect Database
          </Button>
        </div>
      </header>

      {open && (
        <ConnectionStepper
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </>
  );
}
