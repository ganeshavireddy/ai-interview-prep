"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Globe, Briefcase, MapPin, Calendar, FileText, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

const PIPELINE_STAGES = [
  { step: 1, label: "Requirement Extraction", desc: "Analyzing Job Description for core technical & behavioural skills" },
  { step: 2, label: "Company Web Crawling", desc: "Crawling company pages for engineering culture & mission" },
  { step: 3, label: "Interview Process Research", desc: "Synthesizing public interview rounds & technical standards" },
  { step: 4, label: "Question & Flashcard Generation", desc: "Generating categorized technical, behavioural & fit prompts" },
  { step: 5, label: "Coverage & Remediation Loop", desc: "Programmatically auditing requirement coverage (Pass 1 & 2)" },
  { step: 6, label: "Schedule Allocation", desc: "Running arithmetic schedule engine for optimal study flow" },
];

export default function GeneratorWizardPage() {
  const router = useRouter();

  const [company, setCompany] = useState("Stripe");
  const [companyUrl, setCompanyUrl] = useState("https://stripe.com");
  const [role, setRole] = useState("Senior Backend Engineer");
  const [location, setLocation] = useState("Remote");
  const [daysAvailable, setDaysAvailable] = useState(7);
  const [jdText, setJdText] = useState(
    `Stripe is looking for a Senior Backend Engineer to join our Payments Infrastructure team. You will build high-throughput distributed systems in Ruby, Go, and Java.\nRequirements:\n- 5+ years of experience with distributed systems design, API security, and database consistency.\n- Mastery of SQL database transaction isolation levels and distributed locks.\n- Experience with high availability payment processing systems.\n- Strong communication, cross-team mentoring, and incident post-mortem analysis.`
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentDetail, setCurrentDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role || !jdText) {
      setErrorMessage("Please fill in Company Name, Role Title, and Job Description.");
      return;
    }

    setErrorMessage("");
    setIsGenerating(true);
    setCurrentStep(1);
    setCurrentDetail("Initializing research pipeline...");

    // Simulate multi-step progress feedback for optimal UI experience
    const progressTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 6) return prev + 1;
        return prev;
      });
    }, 1200);

    try {
      const response = await fetch("/api/kits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          company_url: companyUrl,
          role,
          location,
          jd_text: jdText,
          days_available: Number(daysAvailable),
        }),
      });

      clearInterval(progressTimer);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed.");
      }

      const kit = await response.json();
      setCurrentStep(6);
      setCurrentDetail("Kit generated successfully! Redirecting to Builder...");

      setTimeout(() => {
        router.push(`/builder/${kit.id || kit._id}`);
      }, 800);
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsGenerating(false);
      setErrorMessage(err.message || "Failed to generate kit. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> AI Prep Kit Wizard
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">
          Generate Your Interview Prep Kit
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          Paste the target Job Description below. Our pipeline will extract requirements, crawl company engineering insights, and build a deterministic prep study plan.
        </p>
      </div>

      {isGenerating ? (
        /* Multi-Step Real-Time Pipeline Progress UI */
        <div className="glass-panel rounded-3xl p-8 md:p-12 border border-indigo-500/30 space-y-8 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 mx-auto flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white">Generating Preparation Kit...</h3>
            <p className="text-xs text-indigo-300 font-mono">
              Step {currentStep} of 6: {PIPELINE_STAGES[currentStep - 1]?.label}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>

          {/* Stage List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {PIPELINE_STAGES.map((s) => {
              const isDone = s.step < currentStep;
              const isCurrent = s.step === currentStep;

              return (
                <div
                  key={s.step}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                    isDone
                      ? "bg-indigo-950/20 border-indigo-500/40 text-gray-200"
                      : isCurrent
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900/40 border-slate-800 text-gray-500"
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 text-[10px] flex items-center justify-center font-mono">
                        {s.step}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{s.label}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Generator Form */
        <form onSubmit={handleGenerate} className="glass-panel rounded-3xl p-6 md:p-10 border border-slate-800 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Target Company Name *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, Google, Acme Inc"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-400" /> Company Website URL
              </label>
              <input
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://company.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Role Title *
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Days Available for Study ({daysAvailable} Days)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={daysAvailable}
                  onChange={(e) => setDaysAvailable(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <span className="text-sm font-mono font-bold text-indigo-400 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                  {daysAvailable}d
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Paste Job Description (JD) *
            </label>
            <textarea
              required
              rows={8}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste full job description text here..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono text-xs leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base hover:opacity-90 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Sparkles className="w-5 h-5" /> Generate Complete Interview Prep Kit
          </button>
        </form>
      )}
    </div>
  );
}
