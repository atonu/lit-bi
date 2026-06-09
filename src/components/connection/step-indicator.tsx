"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex w-full items-center justify-between">
      {steps.map((label, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center shrink-0 relative z-10">
              <div
                className={cn(
                  "flex size-6 sm:size-8 items-center justify-center rounded-full border-2 text-[10px] sm:text-xs font-bold transition-all duration-300",
                  isDone
                    ? "border-chart-2 bg-chart-2 text-white"
                    : isActive
                      ? "border-chart-1 bg-chart-1/10 text-chart-1"
                      : "border-border bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="size-3 sm:size-4" strokeWidth={2.5} />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-center text-[9px] sm:text-[10px] font-medium leading-tight max-w-[70px] sm:max-w-none sm:whitespace-nowrap",
                  isActive
                    ? "text-chart-1"
                    : isDone
                      ? "text-chart-2"
                      : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 mb-4 sm:mb-5 h-px flex-1 transition-colors duration-500",
                  idx < currentStep ? "bg-chart-2" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
