"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                  isDone
                    ? "border-chart-2 bg-chart-2 text-white"
                    : isActive
                      ? "border-chart-1 bg-chart-1/10 text-chart-1"
                      : "border-border bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 whitespace-nowrap text-[10px] font-medium",
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
                  "mx-2 mb-5 h-px w-16 transition-colors duration-500",
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
