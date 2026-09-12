"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Pin,
  Edit3,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Save,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Kit, Question, Flashcard, Requirement } from "@ai-interview-prep/shared";

export default function KitBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "brief" | "flashcards" | "schedule" | "coverage">("questions");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [regeneratingCategory, setRegeneratingCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!kitId) return;
    fetch(`/api/kits/${kitId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setKit(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [kitId]);

  const saveKitChanges = async (updatedKit: Kit) => {
    setKit(updatedKit);
    setSaving(true);
    try {
      await fetch(`/api/kits/${kitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedKit),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = (index: number, key: keyof Question, value: any) => {
    if (!kit) return;
    const updatedQuestions = [...kit.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [key]: value,
      isEdited: true,
    };
    saveKitChanges({ ...kit, questions: updatedQuestions });
  };

  const handleTogglePinQuestion = (index: number) => {
    if (!kit) return;
    const updatedQuestions = [...kit.questions];
    const current = updatedQuestions[index].isPinned;
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      isPinned: !current,
    };
    saveKitChanges({ ...kit, questions: updatedQuestions });
  };

  const handleRegenerateCategory = async (category: string) => {
    if (!kit) return;
    setRegeneratingCategory(category);
    try {
      const res = await fetch(`/api/kits/${kitId}/regenerate-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (res.ok) {
        const updated = await res.json();
        setKit(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingCategory(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-gray-400 text-sm">Loading Kit Builder...</p>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Kit Not Found</h2>
        <Link href="/" className="text-indigo-400 hover:underline text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const questions = kit.questions || [];
  const filteredQuestions =
    selectedCategory === "all"
      ? questions
      : questions.filter((q) => q.category === selectedCategory);

  const uncoveredCount = kit.coverage?.uncovered_requirement_ids?.length || 0;

  return (
    <div className="space-y-8">
      {/* Top Header Bar */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <span>{kit.source.company}</span>
            <span>•</span>
            <span>{kit.source.location}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            {kit.role.title} Interview Kit
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {questions.length} Questions • {kit.flashcards.length} Flashcards • {kit.schedule.days_available} Day Plan
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-indigo-400 font-mono animate-pulse">Saving changes...</span>}
          <Link
            href={`/practice/${kitId}`}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <BookOpen className="w-4 h-4" /> Start Practice Mode
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "questions"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Layers className="w-4 h-4" /> Questions ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab("brief")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "brief"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Company Brief
        </button>
        <button
          onClick={() => setActiveTab("flashcards")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "flashcards"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Flashcards ({kit.flashcards.length})
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "schedule"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Clock className="w-4 h-4" /> Schedule ({kit.schedule.days_available}d)
        </button>
        <button
          onClick={() => setActiveTab("coverage")}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === "coverage"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Coverage Audit ({uncoveredCount > 0 ? `${uncoveredCount} Gaps` : "100%"})
        </button>
      </div>

      {/* TAB CONTENT: QUESTIONS */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          {/* Category Filter & Regeneration Control */}
          <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto">
              {["all", "technical", "system-design", "behavioural", "company-fit"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {cat.replace("-", " ")}
                </button>
              ))}
            </div>

            {selectedCategory !== "all" && (
              <button
                onClick={() => handleRegenerateCategory(selectedCategory)}
                disabled={regeneratingCategory === selectedCategory}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingCategory === selectedCategory ? "animate-spin" : ""}`} />
                <span>Regenerate Unpinned {selectedCategory} Questions</span>
              </button>
            )}
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const originalIndex = questions.findIndex((orig) => orig.id === q.id);

              return (
                <div
                  key={q.id}
                  className={`glass-panel rounded-2xl p-6 border transition-all space-y-3 ${
                    q.isPinned
                      ? "border-indigo-500/50 bg-indigo-950/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {q.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-gray-300">
                        Diff: {q.difficulty}/3
                      </span>
                      {q.isEdited && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          User Edited
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleTogglePinQuestion(originalIndex)}
                      className={`p-2 rounded-xl transition-colors ${
                        q.isPinned ? "bg-indigo-600 text-white" : "bg-slate-800 text-gray-400 hover:text-white"
                      }`}
                      title={q.isPinned ? "Unpin question" : "Pin question to preserve during regeneration"}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Prompt Editor */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Question Prompt</label>
                    <textarea
                      rows={2}
                      value={q.prompt}
                      onChange={(e) => handleUpdateQuestion(originalIndex, "prompt", e.target.value)}
                      className="w-full mt-1 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Answer Outline Editor */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Answer Outline & Key Concepts</label>
                    <textarea
                      rows={3}
                      value={q.answer_outline}
                      onChange={(e) => handleUpdateQuestion(originalIndex, "answer_outline", e.target.value)}
                      className="w-full mt-1 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-gray-300 text-xs focus:border-indigo-500 focus:outline-none transition-colors font-mono leading-relaxed"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMPANY BRIEF */}
      {activeTab === "brief" && (
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Company Intelligence Brief
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase">Mission & Summary</label>
              <textarea
                rows={3}
                value={kit.company_brief.summary}
                onChange={(e) =>
                  saveKitChanges({
                    ...kit,
                    company_brief: { ...kit.company_brief, summary: e.target.value, isEdited: true },
                  })
                }
                className="w-full mt-1 p-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase">What They Do & Product Offerings</label>
              <textarea
                rows={3}
                value={kit.company_brief.what_they_do}
                onChange={(e) =>
                  saveKitChanges({
                    ...kit,
                    company_brief: { ...kit.company_brief, what_they_do: e.target.value, isEdited: true },
                  })
                }
                className="w-full mt-1 p-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Research Sources Used</label>
              <ul className="mt-2 space-y-1">
                {kit.company_brief.sources.map((src, i) => (
                  <li key={i} className="text-xs font-mono text-indigo-400 truncate">
                    • {src}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FLASHCARDS */}
      {activeTab === "flashcards" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Flashcard Collection</h3>
            <Link
              href={`/practice/${kitId}`}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <BookOpen className="w-4 h-4" /> Open Practice Carousel
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kit.flashcards.map((fc, i) => (
              <div key={fc.id || i} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Front (Question/Term)</div>
                <p className="text-sm font-semibold text-white">{fc.front}</p>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2 border-t border-slate-800">
                  Back (Explanation)
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-mono">{fc.back}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" /> Arithmetic Daily Study Schedule
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Distributed across {kit.schedule.days_available} days with integer minute calculations prioritizing must-have technical requirements.
            </p>

            <div className="mt-6 space-y-4">
              {kit.schedule.days.map((d) => (
                <div key={d.day} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 font-extrabold flex items-center justify-center font-mono">
                      D{d.day}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{d.focus}</h4>
                      <p className="text-xs text-gray-400">{d.question_ids.length} Question items allocated</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-800 text-indigo-300 text-xs font-mono font-bold">
                    {d.minutes} Mins
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COVERAGE */}
      {activeTab === "coverage" && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-indigo-400" /> Mandatory Requirement Coverage Audit
            </h3>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
              Passes Executed: {kit.coverage.passes}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white">Extracted Mandatory Requirements</h4>
              <div className="space-y-2">
                {kit.role.requirements.map((req) => (
                  <div key={req.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-200">{req.text}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        req.priority === "must" ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-700 text-gray-400"
                      }`}
                    >
                      {req.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white">Uncovered Requirement IDs</h4>
              {uncoveredCount === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> 100% Requirement Coverage achieved across generated question set!
                </div>
              ) : (
                <div className="space-y-2">
                  {kit.coverage.uncovered_requirement_ids.map((id) => (
                    <div key={id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                      Unmapped ID: {id}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
