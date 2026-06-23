"use client";

import Link from "next/link";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080310] text-gray-200 px-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 p-8 bg-[#12091d]/60 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl">
        <div className="flex justify-center">
          <div className="p-4 bg-[#080310]/50 rounded-full border border-white/10 shadow-inner">
            <HelpCircle className="w-16 h-16 text-primary animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#b900d8] via-purple-500 to-fuchsia-500">
            404
          </h1>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Page Not Found
          </h2>
          <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center bg-primary hover:opacity-90 text-white font-medium rounded-xl shadow-lg hover:shadow-primary/20 transition duration-200"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium border border-white/10 rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>

      <div className="mt-8 text-xs text-zinc-600 tracking-wider">
        Reportbly Intelligence System
      </div>
    </div>
  );
}
