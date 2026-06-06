"use client";

import { useRef, useState, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Suggestion prompts — shown when the conversation is empty
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "show me the names of 10 employees",
  "List the top 5 employees with most sales",
  "Show me total revenue by month",
  "Generate a bar chart comparing salaries by department",
  "Which employees are in the Engineering team?",
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
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Suggestion chips — only when conversation is empty */}
      {isEmpty && (
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSubmit(s)}
              disabled={disabled}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/50 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input container */}
      <div
        className={cn(
          "relative flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
          disabled
            ? "border-white/[0.06] bg-white/[0.02] opacity-60"
            : "border-white/10 bg-white/[0.05] focus-within:border-blue-500/40 focus-within:bg-white/[0.07] focus-within:ring-1 focus-within:ring-blue-500/20"
        )}
      >
        <Sparkles className="mb-1 size-4 shrink-0 text-blue-400/60" />
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={
            disabled
              ? "Thinking…"
              : "Ask a question about your data…"
          }
          className="min-w-0 flex-1 resize-none bg-transparent text-sm text-white/90 placeholder-white/25 outline-none disabled:cursor-not-allowed"
          style={{ minHeight: "24px", maxHeight: "180px" }}
        />
        <button
          id="chat-send-btn"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            "mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95",
            value.trim() && !disabled
              ? "bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/20 hover:brightness-110"
              : "bg-white/[0.06] text-white/20 cursor-not-allowed"
          )}
        >
          <Send className="size-3.5" />
        </button>
      </div>

      <p className="text-center text-[10px] text-white/20">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
