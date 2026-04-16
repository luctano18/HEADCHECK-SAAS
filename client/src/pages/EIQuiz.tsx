import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EI_PILLAR_COLORS,
  EI_PILLAR_ICONS,
  EI_PILLAR_LABELS,
  type EIPillar,
} from "@shared/eiQuizData";

// ── Pillar progress bar ─────────────────────────────────────────────────────
const PILLARS: EIPillar[] = [
  "self-awareness",
  "self-regulation",
  "motivation",
  "empathy",
  "social-skills",
];

const PILLAR_QUESTION_MAP: Record<EIPillar, string[]> = {
  "self-awareness": ["sa1", "sa2", "sa3", "sa4", "sa5"],
  "self-regulation": ["sr1", "sr2", "sr3", "sr4", "sr5"],
  motivation: ["mo1", "mo2", "mo3", "mo4", "mo5"],
  empathy: ["em1", "em2", "em3", "em4", "em5"],
  "social-skills": ["ss1", "ss2", "ss3", "ss4", "ss5"],
};

export default function EIQuiz() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: questions, isLoading: questionsLoading } = trpc.quiz.getQuestions.useQuery();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [quizStarted, setQuizStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const submitAuth = trpc.quiz.submit.useMutation();
  const submitGuest = trpc.quiz.guestSubmit.useMutation();

  const totalQuestions = questions?.length ?? 25;
  const progress = Math.round((currentIndex / totalQuestions) * 100);

  const currentQuestion = questions?.[currentIndex];
  const currentPillar = currentQuestion?.pillar as EIPillar | undefined;

  // Timer: start counting when quiz starts
  useEffect(() => {
    if (!quizStarted) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [quizStarted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Pre-fill selected option if answer already exists
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = answers[currentQuestion.id];
      if (existingAnswer !== undefined) {
        const opt = currentQuestion.options.find((o) => o.score === existingAnswer);
        setSelectedOption(opt?.id ?? null);
      } else {
        setSelectedOption(null);
      }
    }
  }, [currentIndex, currentQuestion, answers]);

  const handleSelectOption = (optionId: string, score: number) => {
    if (animating) return;
    setSelectedOption(optionId);
    if (currentQuestion) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: score }));
    }
  };

  const handleNext = useCallback(async () => {
    if (!selectedOption || animating) return;
    if (currentIndex < totalQuestions - 1) {
      setAnimating(true);
      setDirection("forward");
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAnimating(false);
      }, 300);
    } else {
      // Submit
      setSubmitting(true);
      try {
        let result;
        if (user) {
          result = await submitAuth.mutateAsync({ answers });
        } else {
          result = await submitGuest.mutateAsync({ answers });
        }
        sessionStorage.setItem("headcheck_quiz_result", JSON.stringify(result));
        navigate("/ei-quiz/result");
      } catch (err) {
        console.error("Quiz submission error:", err);
        setSubmitting(false);
      }
    }
  }, [selectedOption, animating, currentIndex, totalQuestions, user, answers, submitAuth, submitGuest, navigate]);

  const handleBack = () => {
    if (currentIndex === 0 || animating) return;
    setAnimating(true);
    setDirection("back");
    setTimeout(() => {
      setCurrentIndex((i) => i - 1);
      setAnimating(false);
    }, 300);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selectedOption) handleNext();
      if (e.key === "ArrowLeft") handleBack();
      if (currentQuestion && e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        const opt = currentQuestion.options[idx];
        if (opt) handleSelectOption(opt.id, opt.score);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedOption, handleNext, currentQuestion]);

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          {/* Hero badge */}
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span>🧠</span>
            <span>Emotional Intelligence Assessment</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Discover Your{" "}
            <span className="bg-gradient-to-r from-violet-600 to-amber-500 bg-clip-text text-transparent">
              EI Profile
            </span>
          </h1>

          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
            25 thoughtful questions across 5 pillars of Emotional Intelligence. Takes about 8 minutes.
            No right or wrong answers — just honest reflection.
          </p>

          {/* Pillar preview */}
          <div className="grid grid-cols-5 gap-3 mb-10">
            {PILLARS.map((pillar) => (
              <div
                key={pillar}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white shadow-sm border border-slate-100"
              >
                <span className="text-2xl">{EI_PILLAR_ICONS[pillar]}</span>
                <span className="text-xs font-medium text-slate-600 text-center leading-tight">
                  {EI_PILLAR_LABELS[pillar]}
                </span>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-10 text-sm text-slate-600">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="text-2xl mb-2">⏱️</div>
              <div className="font-medium text-slate-800">~8 minutes</div>
              <div>25 questions</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium text-slate-800">5 Pillar Scores</div>
              <div>Radar chart</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="text-2xl mb-2">✨</div>
              <div className="font-medium text-slate-800">AI Insight</div>
              <div>From HeadCheck AI</div>
            </div>
          </div>

          {!user && (
            <p className="text-sm text-slate-500 mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              💡 You can take the quiz as a guest. Sign in to save your results and track progress over time.
            </p>
          )}

          <Button
            onClick={() => setQuizStarted(true)}
            className="bg-gradient-to-r from-violet-600 to-amber-500 hover:from-violet-700 hover:to-amber-600 text-white px-10 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Begin the Quiz →
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (questionsLoading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
      <NavBar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{EI_PILLAR_ICONS[currentPillar ?? "self-awareness"]}</span>
              <Badge
                className="text-white text-xs font-medium px-3 py-1"
                style={{ backgroundColor: EI_PILLAR_COLORS[currentPillar ?? "self-awareness"] }}
              >
                {EI_PILLAR_LABELS[currentPillar ?? "self-awareness"]}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">
                {currentIndex + 1} / {totalQuestions}
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-full">
                ⏱ {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, #7C3AED, #F59E0B)`,
              }}
            />
          </div>

          {/* Pillar dots */}
          <div className="flex gap-1 mt-2">
            {PILLARS.map((pillar, pIdx) => {
              const pillarQIds = PILLAR_QUESTION_MAP[pillar];
              const answeredInPillar = pillarQIds.filter((id) => answers[id] !== undefined).length;
              const isActive = currentPillar === pillar;
              const isComplete = answeredInPillar === 5;
              return (
                <div
                  key={pillar}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isComplete
                      ? EI_PILLAR_COLORS[pillar]
                      : isActive
                      ? EI_PILLAR_COLORS[pillar] + "80"
                      : "#E2E8F0",
                  }}
                  title={`${EI_PILLAR_LABELS[pillar]}: ${answeredInPillar}/5`}
                />
              );
            })}
          </div>
        </div>

        {/* Question card */}
        <div
          className={`transition-all duration-300 ${
            animating
              ? direction === "forward"
                ? "opacity-0 translate-x-4"
                : "opacity-0 -translate-x-4"
              : "opacity-100 translate-x-0"
          }`}
        >
          {/* Scenario badge (if present) */}
          {currentQuestion.scenario && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
              <span className="font-semibold">Scenario: </span>
              {currentQuestion.scenario}
            </div>
          )}

          {/* Question */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 md:p-8 mb-6">
            <p className="text-xl md:text-2xl font-semibold text-slate-900 leading-snug mb-8">
              {currentQuestion.text}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id, option.score)}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 group flex items-start gap-4 ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 shadow-md scale-[1.01]"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50 hover:scale-[1.005]"
                    }`}
                  >
                    {/* Option letter */}
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200 ${
                        isSelected
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span
                      className={`text-sm md:text-base leading-relaxed ${
                        isSelected ? "text-violet-900 font-medium" : "text-slate-700"
                      }`}
                    >
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentIndex === 0 || animating}
            className="px-6 py-2 rounded-full border-slate-300 text-slate-600 hover:border-violet-400 hover:text-violet-700 disabled:opacity-30"
          >
            ← Back
          </Button>

          <div className="text-xs text-slate-400 hidden md:block">
            Press 1-4 to select • Enter to continue
          </div>

          <Button
            onClick={handleNext}
            disabled={!selectedOption || animating || submitting}
            className={`px-8 py-2 rounded-full font-semibold transition-all duration-300 ${
              selectedOption && !submitting
                ? "bg-gradient-to-r from-violet-600 to-amber-500 text-white hover:from-violet-700 hover:to-amber-600 shadow-md hover:shadow-lg hover:scale-105"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : currentIndex === totalQuestions - 1 ? (
              "See My Results →"
            ) : (
              "Next →"
            )}
          </Button>
        </div>

        {/* Quit link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
          >
            Save & exit (progress will be lost)
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
