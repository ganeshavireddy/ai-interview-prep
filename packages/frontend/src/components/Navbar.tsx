"use client";

import Link from "next/link";
import { Sparkles, Layers, BookOpen, User, CheckCircle2 } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-dark-border/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              PrepKit <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">AI</span>
            </span>
            <p className="text-xs text-gray-400">The AI Interview Prep Kit</p>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/generator"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:opacity-90 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate New Kit</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Layers className="w-4 h-4 text-gray-400" />
            <span>My Kits</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
