"use client";

import { Button } from "@/components/ui/button";
import { Database, Play, Zap, Shield, BarChart3 } from "lucide-react";

const features = [
  { icon: <Zap className="size-3.5" />, label: "Zero-config setup" },
  { icon: <Shield className="size-3.5" />, label: "Read-only & secure" },
  { icon: <BarChart3 className="size-3.5" />, label: "AI-generated charts" },
];

export function EmptyStateOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Radial gradient backdrop to soften the blur zone */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/60" />

      {/* Glassmorphism card — pointer-events-auto so buttons work */}
      <div
        className="pointer-events-auto animate-slide-up relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-6 overflow-hidden rounded-2xl border border-white/10 bg-background/40 p-10 shadow-2xl shadow-black/40 backdrop-blur-2xl"
        style={{ animationDelay: "200ms" }}
      >
        {/* Gradient blobs behind the card for depth */}
        <div className="absolute -top-20 left-1/2 size-64 -translate-x-1/2 rounded-full bg-chart-1/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 size-48 rounded-full bg-chart-5/10 blur-3xl" />

        {/* Icon */}
        <div className="animate-float relative">
          <div className="animate-pulse-glow flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-1/20 to-chart-5/20 ring-1 ring-white/10">
            <Database className="size-9 text-chart-1" strokeWidth={1.5} />
          </div>
          {/* Orbiting dot */}
          <div className="absolute -right-1 -top-1 size-4 rounded-full bg-gradient-to-br from-chart-2 to-chart-4 shadow-lg" />
        </div>

        {/* Text content */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Connect Your First Data Source
          </h2>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Link your PostgreSQL or MySQL database to start asking questions in
            plain English — no SQL knowledge required.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="text-chart-1">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex w-full flex-col gap-3">
          {/* Primary gradient button */}
          <button
            id="connect-database-cta"
            className="animate-gradient-shift relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-chart-1 via-chart-5 to-chart-1 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-chart-1/25 transition-all hover:shadow-xl hover:shadow-chart-1/40 hover:brightness-110 active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Database className="size-4" />
              Connect Database
            </span>
          </button>

          {/* Ghost secondary */}
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <Play className="size-4" />
            Watch Demo
          </Button>
        </div>

        {/* Supported engines */}
        <p className="text-[11px] text-muted-foreground/60">
          Supports PostgreSQL · MySQL · More coming soon
        </p>
      </div>
    </div>
  );
}
