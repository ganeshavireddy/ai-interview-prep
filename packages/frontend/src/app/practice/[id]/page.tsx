"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, RotateCw, CheckCircle2, ThumbsUp, Flame, RefreshCw, ArrowLeft, ChevronRight } from "lucide-react";
import { Kit, Flashcard } from "@ai-interview-prep/shared";
import { safeFetchJSON } from "@/lib/api";

interface PrioritizedCard extends Flashcard {
  confidenceRating?: "Again" | "Good" | "Easy";
  reviewCount?: number;
}

export default function PracticeModePage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<PrioritizedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!kitId) return;
    safeFetchJSON<Kit>(`/api/kits/${kitId}`)
      .then((data) => {
        if (data) {
          setKit(data);
          const initialQueue: PrioritizedCard[] = (data.flashcards || []).map((fc: Flashcard) => ({
            ...fc,
            reviewCount: 0,
          }));
          setQueue(initialQueue);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [kitId]);

  const handleRateCard = (rating: "Again" | "Good" | "Easy") => {
    if (queue.length === 0) return;

    const currentCard = { ...queue[currentIndex], confidenceRating: rating, reviewCount: (queue[currentIndex].reviewCount || 0) + 1 };
    setIsFlipped(false);

    setTimeout(() => {
      if (rating === "Again") {
        // Spaced repetition: Place "Again" cards 2 spots ahead in queue for immediate re-testing
        const newQueue = [...queue];
        newQueue.splice(currentIndex, 1);
        const insertIndex = Math.min(currentIndex + 2, newQueue.length);
        newQueue.splice(insertIndex, 0, currentCard);
        setQueue(newQueue);
      } else {
        // "Good" or "Easy": Mark progress & move forward
        setCompletedCount((prev) => prev + 1);
        if (currentIndex + 1 < queue.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Completed all cards in round
          setCurrentIndex(queue.length);
        }
      }
    }, 200);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-gray-400 text-sm">Loading Practice Mode...</p>
      </div>
    );
  }

  if (!kit || queue.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">No Flashcards Available</h2>
        <Link href={`/builder/${kitId}`} className="text-indigo-400 hover:underline text-sm">
          Return to Kit Builder
        </Link>
      </div>
    );
  }

  const isFinished = currentIndex >= queue.length;
  const currentCard = queue[currentIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/builder/${kitId}`}
          className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Builder
        </Link>
        <div className="text-xs font-mono text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          {kit.source.company} • {kit.role.title}
        </div>
      </div>

      {isFinished ? (
        /* Completion Screen */
        <div className="glass-panel rounded-3xl p-12 text-center space-y-6 border border-emerald-500/30">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Practice Session Complete!</h2>
          <p className="text-gray-300 text-sm max-w-md mx-auto">
            You reviewed all {queue.length} flashcards with spaced repetition ordering. Great job!
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setCompletedCount(0);
              }}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors"
            >
              Restart Session
            </button>
            <Link
              href={`/builder/${kitId}`}
              className="px-6 py-3 rounded-xl bg-slate-800 text-gray-200 font-semibold text-sm hover:bg-slate-700 transition-colors"
            >
              Return to Builder
            </Link>
          </div>
        </div>
      ) : (
        /* Interactive Flashcard UI */
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Card {currentIndex + 1} of {queue.length}</span>
              <span>Spaced-Repetition Queue</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 cursor-pointer min-h-[320px] w-full"
          >
            <div
              className={`relative w-full h-full min-h-[320px] rounded-3xl transition-transform duration-500 transform-style-3d ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* FRONT SIDE */}
              <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-8 border border-indigo-500/30 flex flex-col justify-between backface-hidden shadow-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40">
                <div className="flex justify-between items-center text-xs text-indigo-400 font-mono">
                  <span>FLASHCARD FRONT</span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <RotateCw className="w-3.5 h-3.5" /> Click to flip
                  </span>
                </div>

                <div className="my-auto py-8">
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-snug">
                    {currentCard.front}
                  </h3>
                </div>

                <div className="text-[11px] text-gray-400">
                  Tap card to reveal answer outline
                </div>
              </div>

              {/* BACK SIDE */}
              <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-8 border border-purple-500/40 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl bg-gradient-to-br from-slate-900 via-purple-950/30 to-indigo-950">
                <div className="flex justify-between items-center text-xs text-purple-400 font-mono">
                  <span>FLASHCARD BACK (ANSWER)</span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <RotateCw className="w-3.5 h-3.5" /> Click to flip front
                  </span>
                </div>

                <div className="my-auto py-6">
                  <p className="text-sm md:text-base text-gray-200 leading-relaxed font-mono whitespace-pre-wrap">
                    {currentCard.back}
                  </p>
                </div>

                <div className="text-[11px] text-gray-400">
                  Rate your confidence level below to adjust repetition priority
                </div>
              </div>
            </div>
          </div>

          {/* 3-Level Confidence Rating Buttons */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <button
              onClick={() => handleRateCard("Again")}
              className="py-3 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs md:text-sm font-bold flex flex-col items-center gap-1 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span>Again (Repeat)</span>
            </button>

            <button
              onClick={() => handleRateCard("Good")}
              className="py-3 px-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs md:text-sm font-bold flex flex-col items-center gap-1 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Good</span>
            </button>

            <button
              onClick={() => handleRateCard("Easy")}
              className="py-3 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs md:text-sm font-bold flex flex-col items-center gap-1 transition-colors"
            >
              <Flame className="w-4 h-4" />
              <span>Easy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
