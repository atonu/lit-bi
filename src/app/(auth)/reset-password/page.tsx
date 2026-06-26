"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/axios";
import Image from "next/image";

import { getErrorMessage } from "@/lib/utils";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill out both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await apiClient.post("/auth/reset-password", { token, password });
        if (res.data.success) {
          router.push("/signin?success=reset");
        }
      } catch (err: any) {
        console.error("Reset password error:", err);
        setError(getErrorMessage(err, "An unexpected error occurred."));
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            New Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-primary/50 focus:bg-white/10"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-primary/50 focus:bg-white/10"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="relative w-full overflow-hidden rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition duration-300 hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Resetting Password...</span>
            </div>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#080310] text-gray-100 bg-dot-pattern px-4">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Brand/Logo */}
        <div className="mb-8 text-center flex flex-col items-center gap-4">
          <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
            <Image
              src="/logo.png"
              alt="reportbly Logo"
              width={200}
              height={200}
              className="rounded-xl"
            />
          </Link>
          <p className="text-sm text-gray-400">
            Set New Password
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#12091d]/80 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-6">Reset Password</h2>

          <Suspense fallback={<div className="text-sm text-white/50">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
