"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="relative flex w-full justify-between items-start">
      {/* Background connector line */}
      <div className="absolute top-[12px] sm:top-[16px] left-[52px] sm:left-[76px] right-[52px] sm:right-[76px] h-px bg-border z-0">
        {/* Active progress connector line */}
        <div
          className="h-full bg-chart-2 transition-all duration-500"
          style={{
            width: currentStep === 0 ? "0%" : currentStep === 1 ? "50%" : "100%"
          }}
        />
      </div>

      {steps.map((label, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <div
            key={label}
            className="flex flex-col items-center shrink-0 relative z-10 w-[80px] sm:w-[120px]"
          >
            {/* Circle */}
            <div
              className={cn(
                "flex size-6 sm:size-8 items-center justify-center rounded-full border-2 text-[10px] sm:text-xs font-bold transition-all duration-300",
                isDone
                  ? "border-chart-2 bg-chart-2 text-white"
                  : isActive
                    ? "border-chart-1 bg-background text-chart-1"
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
        );
      })}
    </div>
  );
}
