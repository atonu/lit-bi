"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import Image from "next/image";

import { getErrorMessage } from "@/lib/utils";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await apiClient.post("/auth/register", { name, email, password });
        if (res.data.success) {
          router.push("/signin?success=registered");
        }
      } catch (err: any) {
        console.error("Signup error:", err);
        setError(getErrorMessage(err, "An unexpected error occurred."));
      }
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0e0e10] text-gray-100 bg-dot-pattern px-4 py-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[100px]" />
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

        {/* Brand / tagline */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            <span className="gradient-text font-extrabold">BI</span>-Lite
          </h1>
          <p className="mt-1 text-sm text-gray-400">Create an account to start analyzing your data</p>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-white/5 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-6">Get Started</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-purple-500/50 focus:bg-white/10"
              />
            </div>

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
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition duration-200 focus:border-purple-500/50 focus:bg-white/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-purple-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
