import { Question, Requirement, Schedule, ScheduleDay } from "@ai-interview-prep/shared";

/**
 * Pure Arithmetic Schedule Allocation Engine.
 * MUST NOT be delegated to an LLM.
 * Distributes material across exactly `days_available` days.
 * High priority (`must`) and higher difficulty (3) placed earlier in schedule.
 * Integer minutes per day calculated strictly based on question difficulty:
 * - Diff 1 = 15 mins
 * - Diff 2 = 30 mins
 * - Diff 3 = 45 mins
 */
export function generateSchedule(
  questions: Question[],
  requirements: Requirement[],
  daysAvailable: number
): Schedule {
  const targetDays = Math.max(1, Math.floor(daysAvailable));

  // Map requirement IDs to priority
  const mustReqSet = new Set(
    requirements.filter((r) => r.priority === "must").map((r) => r.id)
  );

  // Helper to check if a question covers any "must" requirement
  const coversMust = (q: Question): boolean => {
    if (!q.requirement_ids || q.requirement_ids.length === 0) return false;
    return q.requirement_ids.some((reqId) => mustReqSet.has(reqId));
  };

  // Helper to compute question time in minutes
  const getQuestionMinutes = (q: Question): number => {
    switch (q.difficulty) {
      case 3:
        return 45;
      case 2:
        return 30;
      case 1:
      default:
        return 15;
    }
  };

  // Sort questions: High priority ("must") and higher difficulty (3 -> 2 -> 1) first
  const sortedQuestions = [...questions].sort((a, b) => {
    const aMust = coversMust(a) ? 1 : 0;
    const bMust = coversMust(b) ? 1 : 0;
    if (aMust !== bMust) return bMust - aMust; // "must" questions first
    return b.difficulty - a.difficulty; // Higher difficulty first
  });

  // Initialize buckets for exactly `daysAvailable` days
  const dayBuckets: { questions: Question[]; totalMinutes: number }[] = Array.from(
    { length: targetDays },
    () => ({ questions: [], totalMinutes: 0 })
  );

  // Allocate questions using greedy strategy: place in the day bucket with least total minutes
  for (const q of sortedQuestions) {
    let minIndex = 0;
    let minMinutes = dayBuckets[0].totalMinutes;

    for (let i = 1; i < targetDays; i++) {
      if (dayBuckets[i].totalMinutes < minMinutes) {
        minMinutes = dayBuckets[i].totalMinutes;
        minIndex = i;
      }
    }

    dayBuckets[minIndex].questions.push(q);
    dayBuckets[minIndex].totalMinutes += getQuestionMinutes(q);
  }

  // Build ScheduleDay objects
  const days: ScheduleDay[] = dayBuckets.map((bucket, index) => {
    const dayNumber = index + 1;
    const qIds = bucket.questions.map((q) => q.id);

    // Derive realistic focus title
    let focus = "General Technical & Role Review";
    if (bucket.questions.length > 0) {
      const categories = Array.from(new Set(bucket.questions.map((q) => q.category)));
      if (categories.includes("system-design")) {
        focus = "System Design & Architecture";
      } else if (categories.includes("technical")) {
        focus = "Technical Deep Dives & Coding Practice";
      } else if (categories.includes("behavioural")) {
        focus = "Behavioural Scenarios & Leadership";
      } else if (categories.includes("company-fit")) {
        focus = "Company Culture & Strategic Fit";
      }
    } else {
      focus = "Review, Mock Practice & Rest";
    }

    return {
      day: dayNumber,
      focus,
      question_ids: qIds,
      minutes: Math.round(bucket.totalMinutes), // Integer minutes guaranteed
    };
  });

  return {
    days_available: targetDays,
    days,
  };
}
