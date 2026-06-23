"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/lib/stores/auth-store";
import Image from "next/image";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Handle pre-filling email from query parameter safely
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const successMessage =
    searchParams.get("success") === "registered"
      ? "Registration successful! Please sign in below."
      : searchParams.get("success") === "reset"
        ? "Password successfully reset! Please sign in with your new password."
        : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await apiClient.post("/auth/login", { email, password });
        if (res.data.success) {
          setAuth(res.data.user, res.data.accessToken);
          window.location.href = "/";
        }
      } catch (err: any) {
        console.error("Sign-in error:", err);
        setError(err.response?.data?.error || "Invalid email or password.");
      }
    });
  };

  const handleTestAccount = () => {
    setEmail("test@yopmail.com");
    setPassword("12121212");
    setError("");

    startTransition(async () => {
      try {
        const res = await apiClient.post("/auth/login", { email: "test@yopmail.com", password: "12121212" });
        if (res.data.success) {
          setAuth(res.data.user, res.data.accessToken);
          window.location.href = "/";
        }
      } catch (err: any) {
        console.error("Sign-in error:", err);
        setError(err.response?.data?.error || "Invalid email or password.");
      }
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#080310] text-gray-100 bg-dot-pattern px-4 py-10">
      {/* Background radial gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 animate-slide-up">
        <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
          <Image
            src="/favicon.png"
            alt="reportbly Logo"
            width={48}
            height={48}
            className="rounded-xl"
          />
        </Link>

        {/* Brand / tagline */}
        <div className="text-center">
          <p className="mt-1 text-sm text-gray-400">Welcome back! Log in to view your dashboards</p>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-white/10 bg-[#12091d]/80 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-6">Sign In</h2>

          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-xs text-green-400 animate-fade-in">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-primary/50 focus:bg-white/10"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-primary hover:opacity-90 hover:underline">
                  Forgot Password?
                </Link>
              </div>
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

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400 animate-fade-in">
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
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="shrink-0 px-3 text-xs text-gray-500">OR</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleTestAccount}
              disabled={isPending}
              className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50 cursor-pointer"
            >
              Continue with test account
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">Note: Test account does not save chat history.</p>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400">
          New to reportbly?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
