"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Layers, BookOpen, Clock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Kit } from "@ai-interview-prep/shared";
import { safeFetchJSON } from "@/lib/api";

export default function DashboardPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeFetchJSON<Kit[]>("/api/kits")
      .then((data) => {
        if (Array.isArray(data)) setKits(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/60">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Interview Preparation
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Master Every Technical & Cultural Interview Round.
          </h1>
          <p className="text-gray-300 text-base md:text-lg">
            Generate evidence-backed interview prep kits directly from Job Descriptions and live web research with deterministic scheduling & 100% requirement coverage checks.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/generator"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4" /> Create New Prep Kit
            </Link>
          </div>
        </div>
      </div>

      {/* Kits Collection Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" /> My Interview Prep Kits
          </h2>
          <p className="text-sm text-gray-400">Manage, edit, and practice your generated preparation kits</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-48 animate-pulse bg-slate-800/40" />
          ))}
        </div>
      ) : kits.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Prep Kits Generated Yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Paste any Job Description to construct a targeted interview prep kit with customized questions, flashcards, and a daily study schedule.
          </p>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Generate First Kit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map((kit) => {
            const kitId = kit.id || "demo-kit";
            const uncoveredCount = kit.coverage?.uncovered_requirement_ids?.length || 0;
            const isFullCoverage = uncoveredCount === 0;

            return (
              <div
                key={kitId}
                className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                        {kit.source?.company || "Company"}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                        {kit.role?.title || "Software Engineer"}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2">
                    {kit.company_brief?.summary || "Role & interview study kit."}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{kit.schedule?.days_available || 7} Day Plan</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isFullCoverage ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" /> 100% Covered
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {uncoveredCount} Gap{uncoveredCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-3">
                  <Link
                    href={`/builder/${kitId}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Layers className="w-3.5 h-3.5" /> Open Builder
                  </Link>
                  <Link
                    href={`/practice/${kitId}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Practice
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
