"use client";

import Link from "next/link";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#131314] text-gray-200 px-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8 p-8 bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl rounded-2xl shadow-2xl">
        <div className="flex justify-center">
          <div className="p-4 bg-zinc-800/50 rounded-full border border-zinc-700/50 shadow-inner">
            <HelpCircle className="w-16 h-16 text-purple-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
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
            className="flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg hover:shadow-purple-500/20 transition duration-200"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-medium border border-zinc-700/50 rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>

      <div className="mt-8 text-xs text-zinc-600 tracking-wider">
        BI-Lite Intelligence System
      </div>
    </div>
  );
}
