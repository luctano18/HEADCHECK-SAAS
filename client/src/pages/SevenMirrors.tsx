import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Heart, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCircle2, LogIn, Info } from "lucide-react";
import { getLoginUrl } from "@/const";
import { SEVEN_MIRRORS, REFLECTION_BADGES } from "@shared/headcheckData";

type MirrorAnswer = { selected: string[]; other?: string; journal?: string };

export default function SevenMirrors() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [phase, setPhase] = useState<"intro" | "mirror" | "complete">("intro");
  const [currentMirror, setCurrentMirror] = useState(0);
  const [answers, setAnswers] = useState<Record<number, MirrorAnswer>>({});
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [journalText, setJournalText] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  const startSession = trpc.sevenMirrors.startSession.useMutation();
  const submitMirrorResponse = trpc.sevenMirrors.submitMirrorResponse.useMutation();
  const guestSummary = trpc.sevenMirrors.guestSummary.useMutation();

  const mirror = SEVEN_MIRRORS[currentMirror];
  const progress = ((currentMirror + 1) / SEVEN_MIRRORS.length) * 100;
  const currentAnswer = answers[currentMirror] || { selected: [] };

  const canContinue = () => {
    const ans = answers[currentMirror] || { selected: [] };
    if (showOther && !otherText.trim()) return false;
    return ans.selected.length > 0;
  };

  const handleSelect = (option: string) => {
    const prev = answers[currentMirror] || { selected: [] };
    const already = prev.selected.includes(option);
    const newSelected = already
      ? prev.selected.filter((s) => s !== option)
      : [...prev.selected, option];
    setAnswers({ ...answers, [currentMirror]: { ...prev, selected: newSelected } });
  };

  const saveExtras = () => {
    const prev = answers[currentMirror] || { selected: [] };
    setAnswers({
      ...answers,
      [currentMirror]: {
        ...prev,
        other: showOther ? otherText : undefined,
        journal: journalText || undefined,
      },
    });
  };

  const handleStart = async () => {
    if (isAuthenticated) {
      try {
        const result = await startSession.mutateAsync();
        setSessionId(result.sessionId);
      } catch {
        toast.error("Could not start session. Please try again.");
        return;
      }
    }
    setPhase("mirror");
  };

  const handleNext = async () => {
    saveExtras();
    const ans = answers[currentMirror] || { selected: [] };
    const selected = showOther && otherText.trim() ? [...ans.selected, otherText.trim()] : ans.selected;

    if (isAuthenticated && sessionId) {
      try {
        await submitMirrorResponse.mutateAsync({
          sessionId,
          mirrorIndex: currentMirror,
          response: selected.join("; ") + (journalText ? "\n" + journalText : ""),
        });
      } catch {
        toast.error("Could not save response. Continuing...");
      }
    }

    setShowOther(false);
    setOtherText("");
    setJournalText("");

    if (currentMirror < SEVEN_MIRRORS.length - 1) {
      setCurrentMirror(currentMirror + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    saveExtras();
    setShowOther(false);
    setOtherText("");
    setJournalText("");
    if (currentMirror > 0) setCurrentMirror(currentMirror - 1);
    else setPhase("intro");
  };

  const handleComplete = async () => {
    const allAnswers = Object.entries(answers).map(([idx, ans]) => ({
      mirrorId: SEVEN_MIRRORS[parseInt(idx)].id,
      theme: SEVEN_MIRRORS[parseInt(idx)].theme,
      selected: ans.selected,
      journal: ans.journal,
    }));

    try {
      if (isAuthenticated && sessionId) {
        // For authenticated users, the last submitMirrorResponse already triggers completion
        // We just use the guestSummary path to generate a summary from all answers
        const responses = allAnswers.map(a => ({ mirrorTheme: a.theme, response: a.selected.join("; ") + (a.journal ? "\n" + a.journal : "") }));
        const result = await guestSummary.mutateAsync({ responses });
        setAiSummary(result.summary);
        setEarnedBadges(result.badges || []);
      } else {
        const responses = allAnswers.map(a => ({ mirrorTheme: a.theme, response: a.selected.join("; ") + (a.journal ? "\n" + a.journal : "") }));
        const result = await guestSummary.mutateAsync({ responses });
        setAiSummary(result.summary);
        setEarnedBadges(result.badges || []);
      }
      setPhase("complete");
    } catch {
      toast.error("Could not generate your summary. Please try again.");
    }
  };

  const isLoading = startSession.isPending || submitMirrorResponse.isPending || guestSummary.isPending;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.45 0.18 285)" }} />
    </div>
  );

  // ─── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, oklch(0.97 0.03 285) 0%, oklch(0.98 0.02 340) 50%, oklch(0.98 0.02 48) 100%)" }}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl" style={{ color: "oklch(0.45 0.18 285)" }}>
              <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
              HeadCheck
            </button>
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: "oklch(0.95 0.04 285)", color: "oklch(0.45 0.18 285)" }}>
              Self Trust Compass
            </span>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-6 pt-28 pb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 bg-white shadow-sm border" style={{ borderColor: "oklch(0.88 0.06 285)", color: "oklch(0.45 0.18 285)" }}>
              🧭 A Journey Inward
            </div>
            <h1 className="text-4xl font-black mb-4" style={{ color: "oklch(0.18 0.04 260)" }}>The Seven Mirrors</h1>
            <p className="text-lg leading-relaxed" style={{ color: "oklch(0.45 0.04 260)" }}>
              A guided self-reflection practice. Seven mirrors. Seven truths. One honest look at who you are becoming.
            </p>
          </div>

          {/* Mirrors preview grid */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border mb-5" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <h3 className="font-bold mb-4" style={{ color: "oklch(0.18 0.04 260)" }}>Your seven mirrors</h3>
            <div className="grid grid-cols-2 gap-2">
              {SEVEN_MIRRORS.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "oklch(0.96 0.03 285)" }}>
                  <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: "oklch(0.45 0.18 285)", fontSize: "10px" }}>{i + 1}</span>
                  <span className="text-sm font-medium" style={{ color: "oklch(0.25 0.04 260)" }}>{m.theme}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What to expect */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border mb-5" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <h3 className="font-bold mb-3" style={{ color: "oklch(0.18 0.04 260)" }}>What to expect</h3>
            <ul className="space-y-2">
              {[
                "Seven mirrors exploring your relationship with yourself",
                "10–15 minutes of guided reflection",
                "No right answers, only honest ones",
                "AI-generated summary with reflection badges",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "oklch(0.40 0.04 260)" }}>
                  <span style={{ color: "oklch(0.45 0.18 285)" }}>✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-4 rounded-2xl mb-6" style={{ background: "oklch(0.97 0.04 48)", borderLeft: "3px solid oklch(0.72 0.18 48)" }}>
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.55 0.18 48)" }} />
            <p className="text-sm" style={{ color: "oklch(0.40 0.08 48)" }}>
              This is a reflective support tool, not therapy. If you are in crisis, please call or text <strong>988</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full rounded-full py-6 text-base font-bold text-white"
              style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
              onClick={handleStart}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Begin Your Journey
            </Button>
            <Button onClick={() => navigate("/checkin")} variant="outline" className="w-full rounded-full">
              Try Quick Check-In
            </Button>
            <Button onClick={() => navigate("/")} variant="ghost" className="w-full rounded-full" style={{ color: "oklch(0.55 0.04 260)" }}>
              Return Home
            </Button>
          </div>
          <p className="text-center text-xs mt-4" style={{ color: "oklch(0.65 0.03 260)" }}>No account required · Takes 10–15 minutes</p>
        </div>
      </div>
    );
  }

  // ─── MIRROR STEP ────────────────────────────────────────────────────────────
  if (phase === "mirror" && mirror) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, oklch(0.97 0.03 285) 0%, oklch(0.98 0.02 340) 50%, oklch(0.98 0.02 48) 100%)" }}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl" style={{ color: "oklch(0.45 0.18 285)" }}>
              <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
              HeadCheck
            </button>
            <span className="text-sm font-medium" style={{ color: "oklch(0.55 0.04 260)" }}>
              Mirror {currentMirror + 1} of {SEVEN_MIRRORS.length}
            </span>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-6 pt-24 pb-12">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "oklch(0.55 0.04 260)" }}>
              <span>Self Trust Compass</span>
              <span style={{ color: "oklch(0.45 0.18 285)" }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.03 260)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
              />
            </div>
          </div>

          {/* Theme badge */}
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}>
              Mirror {mirror.id} — {mirror.theme}
            </span>
          </div>

          {/* Question card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border mb-4" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.18 0.04 260)" }}>{mirror.question}</h2>
            <p className="text-sm" style={{ color: "oklch(0.55 0.04 260)" }}>Select all that apply</p>
          </div>

          {/* Guidance */}
          {mirror.guidance && (
            <div className="flex items-start gap-2 p-3 rounded-2xl mb-4" style={{ background: "oklch(0.96 0.03 285)" }}>
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.45 0.18 285)" }} />
              <p className="text-sm" style={{ color: "oklch(0.40 0.06 285)" }}>{mirror.guidance}</p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2 mb-4">
            {mirror.options.map((option) => {
              const isSelected = currentAnswer.selected.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 text-sm font-medium"
                  style={{
                    borderColor: isSelected ? "oklch(0.45 0.18 285)" : "oklch(0.90 0.02 260)",
                    background: isSelected ? "linear-gradient(135deg, oklch(0.95 0.04 285), oklch(0.96 0.03 340))" : "white",
                    color: isSelected ? "oklch(0.35 0.12 285)" : "oklch(0.30 0.04 260)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isSelected ? "oklch(0.45 0.18 285)" : "oklch(0.80 0.03 260)",
                        background: isSelected ? "oklch(0.45 0.18 285)" : "transparent",
                      }}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    {option}
                  </div>
                </button>
              );
            })}

            {/* Other */}
            <button
              onClick={() => setShowOther(!showOther)}
              className="w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 text-sm font-medium"
              style={{
                borderColor: showOther ? "oklch(0.45 0.18 285)" : "oklch(0.90 0.02 260)",
                background: showOther ? "linear-gradient(135deg, oklch(0.95 0.04 285), oklch(0.96 0.03 340))" : "white",
                color: showOther ? "oklch(0.35 0.12 285)" : "oklch(0.30 0.04 260)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: showOther ? "oklch(0.45 0.18 285)" : "oklch(0.80 0.03 260)",
                    background: showOther ? "oklch(0.45 0.18 285)" : "transparent",
                  }}
                >
                  {showOther && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                Other
              </div>
            </button>
          </div>

          {showOther && (
            <div className="mb-4">
              <Input
                placeholder={mirror.otherPrompt}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                className="rounded-2xl"
                style={{ borderColor: "oklch(0.85 0.04 285)" }}
              />
            </div>
          )}

          {/* Journal */}
          <div className="mb-6">
            <Textarea
              placeholder={mirror.journalPlaceholder}
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="rounded-2xl resize-none text-sm"
              style={{ borderColor: "oklch(0.90 0.03 260)" }}
              rows={4}
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 rounded-2xl border-2"
              style={{ borderColor: "oklch(0.88 0.03 260)" }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canContinue() || isLoading}
              className="flex-[2] h-12 rounded-2xl font-semibold text-white"
              style={{ background: canContinue() ? "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" : undefined }}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {currentMirror === SEVEN_MIRRORS.length - 1 ? "Generating..." : "Saving..."}</>
              ) : currentMirror === SEVEN_MIRRORS.length - 1 ? (
                "Complete Journey ✓"
              ) : (
                <>Next Mirror <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "oklch(0.65 0.03 260)" }}>
            If you are in crisis, please call or text <strong>988</strong>.
          </p>
        </div>
      </div>
    );
  }

  // ─── COMPLETION ─────────────────────────────────────────────────────────────
  if (phase === "complete") {
    const earnedBadgeObjects = REFLECTION_BADGES.filter(b => earnedBadges.includes(b.id));

    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, oklch(0.97 0.03 285) 0%, oklch(0.98 0.02 340) 50%, oklch(0.98 0.02 48) 100%)" }}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl" style={{ color: "oklch(0.45 0.18 285)" }}>
              <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
              HeadCheck
            </button>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-6 pt-24 pb-16">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg, oklch(0.92 0.06 285), oklch(0.95 0.04 340))" }}>
              <Sparkles className="w-10 h-10" style={{ color: "oklch(0.45 0.18 285)" }} />
            </div>
            <h1 className="text-3xl font-black mb-3" style={{ color: "oklch(0.18 0.04 260)" }}>You did it.</h1>
            <p className="leading-relaxed" style={{ color: "oklch(0.45 0.04 260)" }}>
              You completed all seven mirrors. That takes courage. Here is what your reflection revealed.
            </p>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border mb-5" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" style={{ color: "oklch(0.45 0.18 285)" }} />
                <h3 className="font-bold" style={{ color: "oklch(0.18 0.04 260)" }}>Your Reflection Summary</h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.35 0.04 260)" }}>{aiSummary}</p>
            </div>
          )}

          {/* Badges */}
          {earnedBadgeObjects.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border mb-5" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
              <h3 className="font-bold mb-4" style={{ color: "oklch(0.18 0.04 260)" }}>Badges Earned</h3>
              <div className="flex flex-wrap gap-2">
                {earnedBadgeObjects.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2" style={{ borderColor: badge.color, background: `${badge.color}15` }}>
                    <span>{badge.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: badge.color }}>{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mirrors recap */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border mb-5" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <h3 className="font-bold mb-4" style={{ color: "oklch(0.18 0.04 260)" }}>Your Seven Mirrors</h3>
            <div className="space-y-2">
              {SEVEN_MIRRORS.map((m, i) => {
                const ans = answers[i];
                return (
                  <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "oklch(0.96 0.03 285)" }}>
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.45 0.18 285)" }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "oklch(0.25 0.04 260)" }}>{m.theme}</p>
                      {ans?.selected.length > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.04 260)" }}>
                          {ans.selected.slice(0, 2).join(", ")}{ans.selected.length > 2 ? ` +${ans.selected.length - 2} more` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest nudge */}
          {!isAuthenticated && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border mb-5 text-center" style={{ borderColor: "oklch(0.88 0.06 285)" }}>
              <p className="text-sm mb-3" style={{ color: "oklch(0.40 0.04 260)" }}>
                <strong>Save your reflection.</strong> Create a free account to track your journey over time.
              </p>
              <a
                href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}
              >
                <LogIn className="w-4 h-4" /> Create Free Account
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              className="w-full h-12 rounded-2xl font-semibold text-white"
              style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
              onClick={() => navigate("/checkin")}
            >
              Do a Check-In
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-2xl" onClick={() => navigate("/")}>
              Return Home
            </Button>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "oklch(0.65 0.03 260)" }}>
            If you are in crisis, please call or text <strong>988</strong>.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
