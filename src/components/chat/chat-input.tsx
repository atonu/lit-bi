"use client";

import { useRef, useState, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Suggestion prompts — shown when the conversation is empty
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "Show me total revenue by month for this year",
  "show me the names of 10 employees",
  "List the top 2 employees with most sales",
  "Generate a line chart comparing sales by emplyees",
  "Generate a pie chart comparing salaries of emplyees",
];

interface ChatInputProps {
  onSubmit: (question: string) => void;
  disabled?: boolean;
  isEmpty?: boolean;
}

export function ChatInput({ onSubmit, disabled = false, isEmpty = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSubmit]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Auto-resize textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  function handleSuggestion(suggestion: string) {
    onSubmit(suggestion);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Suggestion chips — only when conversation is empty */}
      {isEmpty && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              disabled={disabled}
              className="rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground transition-all hover:border-chart-1/40 hover:bg-chart-1/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border bg-muted/20 px-3 py-2 transition-all",
          disabled
            ? "border-border/30 opacity-60"
            : "border-border/50 focus-within:border-chart-1/40 focus-within:bg-chart-1/5 focus-within:ring-1 focus-within:ring-chart-1/20"
        )}
      >
        <Sparkles className="mb-1.5 size-4 shrink-0 text-chart-1/60" />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={
            disabled
              ? "Processing…"
              : "Ask a question about your data…"
          }
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed"
          style={{ minHeight: "24px", maxHeight: "140px" }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            "mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
            value.trim() && !disabled
              ? "bg-gradient-to-br from-chart-1 to-chart-5 text-white shadow-md shadow-chart-1/20 hover:brightness-110 active:scale-95"
              : "bg-muted text-muted-foreground/30 cursor-not-allowed"
          )}
        >
          <Send className="size-3.5" />
        </button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground/50">
        Press Enter to send · Shift+Enter for new line · Results limited to 500 rows
      </p>
    </div>
  );
}
