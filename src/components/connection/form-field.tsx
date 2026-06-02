"use client";

import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  suffix?: React.ReactNode;
}

export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  suffix,
}: FormFieldProps) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPass ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
        {required && <span className="text-chart-4">*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={isPassword ? "current-password" : undefined}
          className={cn(
            "h-10 w-full rounded-lg border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground/50",
            "transition-colors focus:outline-none focus:ring-2",
            error
              ? "border-destructive/60 focus:ring-destructive/20"
              : "border-border/60 focus:border-chart-1/60 focus:ring-chart-1/20",
            disabled && "cursor-not-allowed opacity-50",
            suffix && "pr-10",
            isPassword && "pr-10"
          )}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPass ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}

        {/* Custom suffix */}
        {suffix && !isPassword && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
