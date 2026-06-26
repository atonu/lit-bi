"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import apiClient from "@/lib/axios";

import { getErrorMessage } from "@/lib/utils";

interface ProspectInfo {
  name: string;
  email: string;
  createdAt?: string;
}

export default function SetPasswordPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: prospectId } = React.use(params);

  const [prospect, setProspect] = useState<ProspectInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Load prospect info on mount
  useEffect(() => {
    if (!prospectId) return;
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";
    fetch(`${BACKEND_URL}/api/onboard/prospect/${prospectId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data: ProspectInfo) => {
        if (data.createdAt) {
          const createdTime = new Date(data.createdAt).getTime();
          const diffMs = Date.now() - createdTime;
          if (diffMs > 10 * 60 * 1000) {
            setNotFound(true);
            return;
          }
        }
        setProspect(data);
      })
      .catch(() => setNotFound(true));
  }, [prospectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await apiClient.post("/auth/register", {
          name: prospect!.name,
          email: prospect!.email,
          password,
          prospectId,
        });
        if (res.data.success) {
          // Log out existing user if logged in
          try {
            await apiClient.post("/auth/logout");
          } catch {}
          const { useAuthStore } = await import("@/lib/stores/auth-store");
          useAuthStore.getState().logout();

          router.push("/signin?success=registered");
        }
      } catch (err: any) {
        setError(getErrorMessage(err, "Registration failed. Please try again."));
      }
    });
  };

  if (notFound) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0e0e10] text-gray-100 px-4">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
        <div className="relative z-10 text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Link Expired</h1>
          <p className="text-gray-400 mb-8">
            This set-password link is invalid or has already been used. Please contact your administrator.
          </p>
          <Link
            href="/signin"
            className="inline-block rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-500 transition"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e10]">
        <div className="flex items-center gap-3 text-white/50">
          <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0e0e10] text-gray-100 bg-dot-pattern px-4 py-10">
      {/* Background radial gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 animate-slide-up">
        {/* Logo — in document flow, never overlaps */}
        <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
          <div className="flex size-20 items-center justify-center overflow-hidden drop-shadow-2xl">
            <Image
              src="/favicon.png"
              alt="BI-Lite Logo"
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </div>
        </Link>

        {/* Brand/Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            <span className="gradient-text font-extrabold">BI</span>-Lite
          </h1>
          <p className="mt-1 text-sm text-gray-400">Welcome, {prospect.name}! Set your password to get started.</p>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-white/5 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-2">Set Your Password</h2>
          <p className="text-xs text-gray-500 mb-6">Account: <span className="text-purple-400">{prospect.email}</span></p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="set-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="set-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-purple-500/50 focus:bg-white/10"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-purple-500/50 focus:bg-white/10"
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
              className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition duration-300 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Creating Account…</span>
                </div>
              ) : (
                "Set Password & Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-purple-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
