"use client";

import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Wifi,
  Clock,
  Server,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import type { TestConnectionResult } from "@/app/actions/connection";

interface StepTestProps {
  result: TestConnectionResult | null;
  isIntrospecting: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function StepTest({
  result,
  isIntrospecting,
  onNext,
  onBack,
}: StepTestProps) {
  const isSuccess = result?.success === true;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 flex flex-col gap-6">
        {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          Connection Test
        </h3>
        <p className="text-xs text-muted-foreground">
          Verifying connectivity to your database server.
        </p>
      </div>

      {/* Result card */}
      <div
        className={`rounded-xl border p-6 transition-all ${
          result === null
            ? "border-border/40 bg-muted/20"
            : isSuccess
              ? "border-chart-2/30 bg-chart-2/5"
              : "border-destructive/30 bg-destructive/5"
        }`}
      >
        {result === null ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="size-10 animate-spin text-chart-1" />
            <p className="text-sm text-muted-foreground">
              Connecting to database…
            </p>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-8 shrink-0 text-chart-2" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Connection Successful
                </p>
                <p className="text-xs text-muted-foreground">
                  Your database is reachable and accepting connections.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 rounded-lg border border-border/30 bg-background/50 p-3">
                <Wifi className="size-4 text-chart-2" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Status
                </p>
                <p className="text-xs font-semibold text-chart-2">
                  Online
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border/30 bg-background/50 p-3">
                <Clock className="size-4 text-chart-1" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Latency
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {result.latencyMs}ms
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border/30 bg-background/50 p-3">
                <Server className="size-4 text-chart-3" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Version
                </p>
                <p className="truncate text-xs font-semibold text-foreground">
                  {result.serverVersion ?? "—"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <XCircle className="size-8 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Connection Failed
                </p>
                <p className="text-xs text-muted-foreground">
                  Unable to reach the database. Check your credentials and
                  firewall rules.
                </p>
              </div>
            </div>
            {result.error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
                <p className="font-mono text-xs text-destructive/90">
                  {result.error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      </div>

      {/* Actions */}
      <div className="border-t border-border/50 p-6 bg-background flex gap-3 shrink-0">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isIntrospecting}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <Button
          id="step-test-next"
          onClick={onNext}
          disabled={!isSuccess || isIntrospecting}
          className="flex-1 gap-2 bg-gradient-to-r from-chart-1 to-chart-5 text-white hover:brightness-110 disabled:opacity-40"
        >
          {isIntrospecting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Introspecting Schema…
            </>
          ) : (
            <>
              Introspect Schema
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
