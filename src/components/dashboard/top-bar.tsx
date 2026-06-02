"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Search } from "lucide-react";
import { ConnectionStepper } from "@/components/connection/connection-stepper";

export function TopBar() {
  const [open, setOpen] = useState(false);

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

        {/* Right: Search + CTA */}
        <div className="flex items-center gap-3">
          {/* Search (disabled in empty state) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Ask a question..."
              disabled
              className="h-9 w-64 rounded-lg border border-border/50 bg-muted/30 pl-10 pr-4 text-sm text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

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
