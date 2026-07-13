import { useState, useEffect } from "react";
import { useNavProgress } from "@/contexts/NavProgressContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {
  AlertTriangle, Phone, Heart, ChevronLeft, ChevronRight,
  CheckCircle2, Info, Loader2,
} from "lucide-react";
import { CHECKIN_STEPS } from "@shared/headcheckData";

// ─── Crisis Detection (client-side real-time) ─────────────────────────────────
const CRISIS_KEYWORDS = [
  // Suicidal ideation
  "kill myself", "suicide", "end my life", "want to die", "don't want to live",
  "hurt myself", "self-harm", "cutting myself", "overdose", "jump off",
  "hopeless", "worthless", "can't go on", "no reason to live", "disappear forever",
  "nobody cares", "better off dead", "give up on life", "can't take it anymore",
  "i want to disappear", "i feel unsafe",
  // French equivalents
  "me tuer", "je veux mourir", "en finir", "mettre fin à ma vie",
  "me faire du mal", "me blesser", "sans espoir", "je veux disparaître",
  // Violence toward others
  "want to hurt", "want to kill", "going to hurt", "going to attack",
  "want to harm", "hurt someone", "kill them", "attack them",
  "faire du mal à", "blesser quelqu'un", "tuer quelqu'un",
];
function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}
function detectViolenceTowardOthers(text: string): boolean {
  const lower = text.toLowerCase();
  const violenceKws = ["want to hurt", "want to kill", "going to hurt", "going to attack", "want to harm", "hurt someone", "kill them", "attack them", "faire du mal à", "blesser quelqu'un", "tuer quelqu'un"];
  return violenceKws.some((kw) => lower.includes(kw));
}

type StepAnswer = { selected: string[]; other?: string; journal?: string };

export default function CheckIn() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { setProgress, clearProgress } = useNavProgress();

  const [currentStep, setCurrentStep] = useState(0); // 0 = intro
  const [answers, setAnswers] = useState<Record<number, StepAnswer>>({});
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [journalText, setJournalText] = useState("");
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [crisisType, setCrisisType] = useState<"self" | "violence">("self");
  const [showNotYetMessage, setShowNotYetMessage] = useState(false);
  const [responseStyle, setResponseStyle] = useState<"short" | "normal" | "coach">("normal");

  const createCheckIn = trpc.checkIns.create.useMutation();
  const guestCreate = trpc.checkIns.guestCreate.useMutation();

  const totalSteps = CHECKIN_STEPS.length; // 10
  const stepData = currentStep > 0 ? CHECKIN_STEPS[currentStep - 1] : null;
  const currentAnswer = answers[currentStep] || { selected: [] };

  // Real-time crisis detection on journal text
  useEffect(() => {
    if (journalText.length > 10 && detectCrisis(journalText)) {
      setCrisisType(detectViolenceTowardOthers(journalText) ? "violence" : "self");
      setShowCrisisModal(true);
    }
  }, [journalText]);

  // Sync progress with NavBar (including step summaries)
  useEffect(() => {
    if (currentStep > 0) {
      // Show loading spinner while step data is being computed
      setProgress({ isLoadingSteps: true });
      const tid = setTimeout(() => {
        const steps = CHECKIN_STEPS.map((s) => ({
          id: s.step,
          label: s.question.length > 40 ? s.question.substring(0, 38) + "…" : s.question,
          description: (s as Record<string, unknown>).helper as string | undefined
            ?? (s as Record<string, unknown>).guidance as string | undefined
            ?? (s as Record<string, unknown>).reflection as string | undefined,
          status: (
            s.step < currentStep ? "done" :
            s.step === currentStep ? "current" :
            "upcoming"
          ) as import("@/contexts/NavProgressContext").StepStatus,
        }));
        setProgress({
          current: currentStep,
          total: totalSteps,
          label: "Check-In",
          color: "linear-gradient(90deg, #7c3aed, #ec4899)",
          active: true,
          steps,
          isLoadingSteps: false,
        });
      }, 350);
      return () => { clearTimeout(tid); clearProgress(); };
    } else {
      clearProgress();
    }
    return () => { clearProgress(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const canContinue = (): boolean => {
    if (currentStep === 0) return true;
    if (!stepData) return false;
    const ans = answers[currentStep] || { selected: [] };
    if (showOther && !otherText.trim()) return false;
    return ans.selected.length > 0;
  };

  const handleSelect = (option: string) => {
    if (!stepData) return;
    const prev = answers[currentStep] || { selected: [] };
    if (stepData.type === "single") {
      setAnswers({ ...answers, [currentStep]: { ...prev, selected: [option] } });
      setShowNotYetMessage(option === "Not yet" && stepData.step === 9);
    } else {
      const already = prev.selected.includes(option);
      const newSelected = already
        ? prev.selected.filter((s) => s !== option)
        : [...prev.selected, option];
      setAnswers({ ...answers, [currentStep]: { ...prev, selected: newSelected } });
    }
  };

  const saveCurrentExtras = () => {
    const prev = answers[currentStep] || { selected: [] };
    setAnswers({
      ...answers,
      [currentStep]: {
        ...prev,
        other: showOther ? otherText : undefined,
        journal: journalText || undefined,
      },
    });
  };

  const handleContinue = () => {
    saveCurrentExtras();
    setShowOther(false);
    setOtherText("");
    setJournalText("");
    setShowNotYetMessage(false);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    saveCurrentExtras();
    setShowOther(false);
    setOtherText("");
    setJournalText("");
    setShowNotYetMessage(false);
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleSubmit = async () => {
    const wantsSave = answers[10]?.selected[0] === "Yes";
    const primaryEmotion = answers[1]?.selected[0] || "overwhelmed";
    const stressors = answers[2]?.selected || [];
    const emotionalImpact = answers[3]?.selected || [];
    const intenseFeelings = answers[4]?.selected || [];
    const secondaryStressors = answers[5]?.selected || [];
    const supportNeed = answers[6]?.selected[0] || "";
    const possibleAction = answers[7]?.selected[0] || "";
    const supportType = answers[8]?.selected[0] || "";
    const didHelpRaw = answers[9]?.selected[0] || "";
    const allJournals = Object.values(answers).map(a => a.journal).filter(Boolean).join("\n");

    const intensity = intenseFeelings.length >= 7 ? 9
      : intenseFeelings.length >= 4 ? 7
      : intenseFeelings.length >= 2 ? 5 : 3;

    const context = (stressors.some(s => s.toLowerCase().includes("family")) ? "Family"
      : stressors.some(s => s.toLowerCase().includes("work")) ? "Work"
      : stressors.some(s => s.toLowerCase().includes("assignment") || s.toLowerCase().includes("exam")) ? "School"
      : "Self") as "School" | "Family" | "Relationships" | "Work" | "Self";

    const journalEntry = allJournals || `Stressors: ${stressors.join(", ")}. Support needed: ${supportNeed}. Possible action: ${possibleAction}. Support type: ${supportType}.`;

    // Map didHelp raw answer to enum
    const didHelpMap: Record<string, "yes_clearer" | "somewhat_calmer" | "not_yet"> = {
      "Yes, I feel clearer": "yes_clearer",
      "Somewhat, I feel calmer": "somewhat_calmer",
      "Not yet": "not_yet",
    };
    const didHelp = didHelpMap[didHelpRaw] as "yes_clearer" | "somewhat_calmer" | "not_yet" | undefined;

    const payload = {
      emotion: primaryEmotion.toLowerCase(),
      intensity,
      context,
      journalEntry,
      // EEIS structured inputs
      contributors: stressors,
      emotionalImpact,
      intenseFeelings,
      secondaryStressors,
      supportPreference: supportNeed || undefined,
      possibleNextStep: possibleAction || undefined,
      supportSource: supportType || undefined,
      didHelp,
      journalNotes: allJournals || undefined,
      responseStyle, // Nouveau : style de réponse AI
    };

    try {
      let checkInId: number | undefined;
      let guestResult: unknown;
      let interventionData: unknown = null;

      if (isAuthenticated && wantsSave) {
        const result = await createCheckIn.mutateAsync(payload);
        checkInId = result.checkInId;
        interventionData = result.intervention;

        const streak = result.streak;
        let toastDelay = 0;
        if (streak?.checkinsChallenge?.completed) {
          toast.success(`🏆 Challenge completed: ${streak.checkinsChallenge.title} (+${streak.checkinsChallenge.xpReward} XP)`);
          toastDelay += 600;
        }
        if (streak?.streakChallenge?.completed) {
          setTimeout(() => toast.success(`🏆 Challenge completed: ${streak.streakChallenge!.title} (+${streak.streakChallenge!.xpReward} XP)`), toastDelay);
          toastDelay += 600;
        }
        if (streak?.leveledUp) {
          setTimeout(() => toast.success(`🎉 Level up! You're now Level ${streak.level}`), toastDelay);
          toastDelay += 600;
        }
        streak?.newAchievements?.forEach((achievement) => {
          setTimeout(() => toast.success(achievement), toastDelay);
          toastDelay += 600;
        });
      } else {
        const result = await guestCreate.mutateAsync({
          emotion: payload.emotion,
          intensity: payload.intensity,
          context: payload.context,
          journalEntry: payload.journalEntry,
        });
        guestResult = result;
      }

      // Store summary data in sessionStorage for the intermediate summary screen
      sessionStorage.setItem("headcheck_summary", JSON.stringify({
        primaryEmotion,
        stressors,
        supportNeed,
        possibleAction,
        supportType,
        wantsSave,
        checkInId,
        guestResult,
        intervention: interventionData,
      }));

      // Navigate to intermediate summary screen
      navigate("/checkin/summary");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const isLoading = createCheckIn.isPending || guestCreate.isPending;

  // ─── Crisis Modal ──────────────────────────────────────────────────────────
  if (showCrisisModal) {
    const isViolence = crisisType === "violence";
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: isViolence ? "linear-gradient(135deg, #fff8f0 0%, #fff 50%, #fff1f2 100%)" : "linear-gradient(135deg, #fff1f2 0%, #fff 50%, #fff8f0 100%)" }}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-red-100">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isViolence ? "bg-orange-100" : "bg-red-100"}`}>
            {isViolence ? <AlertTriangle className="w-8 h-8 text-orange-500" /> : <Heart className="w-8 h-8 text-red-500" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {isViolence ? "Let's Talk About This" : "You Are Not Alone"}
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {isViolence
              ? "These thoughts are a signal that something needs to change. Talking to someone can help — before things escalate."
              : "Your safety matters. You deserve support right now. Help is available."}
          </p>
          <div className="space-y-3 mb-6">
            <a href="tel:3114" className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors">
              <Phone className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">3114 — National Suicide Prevention (France)</div>
                <div className="text-sm text-gray-500">France · 24/7, free</div>
              </div>
            </a>
            <a href="tel:988" className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl hover:bg-orange-100 transition-colors">
              <Phone className="w-5 h-5 text-orange-500" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">988 — Suicide & Crisis Lifeline</div>
                <div className="text-sm text-gray-500">USA · 24/7, free</div>
              </div>
            </a>
            <a href="sms:741741?body=HOME" className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl hover:bg-purple-100 transition-colors">
              <AlertTriangle className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Text HOME to 741741</div>
                <div className="text-sm text-gray-500">Crisis Text Line — Free, 24/7</div>
              </div>
            </a>
          </div>
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl text-sm"
              onClick={() => { setShowCrisisModal(false); navigate("/crisis-support"); }}
            >
              View Full Resources
            </Button>
            {isViolence && (
              <Button
                variant="outline"
                className="flex-1 rounded-2xl text-sm"
                onClick={() => { setShowCrisisModal(false); navigate("/violence-prevention"); }}
              >
                Safety Plan
              </Button>
            )}
          </div>
          <Button variant="ghost" className="w-full rounded-2xl text-sm text-gray-500" onClick={() => setShowCrisisModal(false)}>
            I'm okay for now — continue
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            HeadCheck is not a crisis service. If you are in immediate danger, call 911 (US) or your local emergency number.
          </p>
        </div>
      </div>
    );
  }

   // ─── Intro Screen ────────────────────────────────────────────────────────
  if (currentStep === 0) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f0ff 0%, #fff5f5 50%, #fff8f0 100%)" }}>
        <NavBar />
        <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
          <div className="flex justify-end mb-6">
            <button onClick={() => setShowCrisisModal(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3" /> Crisis Support
            </button>
          </div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: "linear-gradient(135deg, #ede9fe, #fce7f3)", color: "#7c3aed" }}>
              <Heart className="w-4 h-4" /> Emotional Check-In
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">How are you doing?</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              HeadCheck helps you understand your feelings, reflect with honesty, and take your next step with clarity.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">What to expect</h3>
            <div className="space-y-3">
              {[
                "10 guided questions — about 5 minutes",
                "No right or wrong answers — just honest ones",
                "Real-time AI guidance based on your responses",
                "Crisis support available at any moment",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#7c3aed" }} />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <Button
            className="w-full h-14 rounded-2xl text-lg font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            onClick={() => setCurrentStep(1)}
          >
            Begin Check-In
          </Button>
          <p className="text-center text-xs text-gray-400 mt-4">
            No account required. Your responses are private and secure.
          </p>
          <p className="text-center text-xs text-gray-400 mt-1">
            HeadCheck is a reflective support tool, not a substitute for professional mental health care.
          </p>
        </div>
      </div>
    );
  }

  // ─── Step Screen ───────────────────────────────────────────────────────────
  if (!stepData) return null;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f0ff 0%, #fff5f5 50%, #fff8f0 100%)" }}>
      <NavBar />
      <div className="max-w-lg mx-auto px-4 pt-24 pb-8">
        {/* Crisis Support link */}
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowCrisisModal(true)} className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
            <Phone className="w-3 h-3" /> Crisis Support
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium" style={{ color: "#7c3aed" }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #ec4899)" }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{stepData.question}</h2>
          {stepData.type === "multi" && (
            <p className="text-sm text-gray-500">Select all that apply</p>
          )}
        </div>

        {/* Helper text */}
        {"helper" in stepData && (stepData as any).helper && (
          <div className="flex items-start gap-2 p-3 rounded-2xl mb-4" style={{ background: "#f5f0ff" }}>
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#7c3aed" }} />
            <p className="text-sm" style={{ color: "#7c3aed" }}>{(stepData as any).helper}</p>
          </div>
        )}

        {/* Guidance card (Step 6) */}
        {"guidance" in stepData && (stepData as any).guidance && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-sm text-amber-800 italic">{(stepData as any).guidance}</p>
          </div>
        )}

        {/* Reflection card (Step 8) */}
        {"reflection" in stepData && (stepData as any).reflection && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
            <p className="text-sm text-purple-800 italic">{(stepData as any).reflection}</p>
          </div>
        )}

        {/* Why This Works card (Step 10) */}
        {"whyItWorks" in stepData && (stepData as any).whyItWorks && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-green-700 mb-1">Why This Works</p>
            <p className="text-sm text-green-800">{(stepData as any).whyItWorks}</p>
          </div>
        )}

        {/* "Not yet" conditional message (Step 9) */}
        {showNotYetMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
            <p className="text-sm text-blue-800">
              That is okay. Sometimes clarity takes more than one moment. We can still help you identify a next step.
            </p>
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-2 mb-4">
          {stepData.options.map((option) => {
            const isSelected = currentAnswer.selected.includes(option);
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className="w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 font-medium text-sm"
                style={{
                  borderColor: isSelected ? "#7c3aed" : "#e5e7eb",
                  background: isSelected ? "linear-gradient(135deg, #ede9fe, #fce7f3)" : "white",
                  color: isSelected ? "#7c3aed" : "#374151",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                    style={{ borderColor: isSelected ? "#7c3aed" : "#d1d5db", background: isSelected ? "#7c3aed" : "transparent" }}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  {option}
                </div>
              </button>
            );
          })}

          {/* Other option */}
          {stepData.hasOther && (
            <button
              onClick={() => setShowOther(!showOther)}
              className="w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 font-medium text-sm"
              style={{
                borderColor: showOther ? "#7c3aed" : "#e5e7eb",
                background: showOther ? "linear-gradient(135deg, #ede9fe, #fce7f3)" : "white",
                color: showOther ? "#7c3aed" : "#374151",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                  style={{ borderColor: showOther ? "#7c3aed" : "#d1d5db", background: showOther ? "#7c3aed" : "transparent" }}
                >
                  {showOther && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                Other
              </div>
            </button>
          )}
        </div>

        {/* Other text input */}
        {showOther && (
          <div className="mb-4">
            <Input
              placeholder={stepData.otherPrompt || "Tell us more..."}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              className="rounded-2xl border-purple-200 focus:border-purple-400"
            />
          </div>
        )}

        {/* Journal box (steps 1–8 only) */}
        {currentStep <= 8 && (
          <div className="mb-6">
            <Textarea
              placeholder="Write freely here... (optional)"
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="rounded-2xl border-purple-100 focus:border-purple-300 resize-none text-sm"
              rows={3}
            />
          </div>
        )}

        {/* Response Style Selector (visible on last steps) */}
        {currentStep >= 8 && (
          <div className="mb-4 p-3 bg-white rounded-2xl border border-purple-100">
            <p className="text-xs font-medium text-gray-500 mb-2">AI Response Style</p>
            <div className="flex gap-2">
              {[
                { value: "short", label: "Short" },
                { value: "normal", label: "Balanced" },
                { value: "coach", label: "Coach" },
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => setResponseStyle(style.value as "short" | "normal" | "coach")}
                  className={`flex-1 py-1.5 text-sm rounded-xl border transition-all ${
                    responseStyle === style.value
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack} className="flex-1 h-12 rounded-2xl border-2 border-gray-200">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue() || isLoading}
            className="flex-[2] h-12 rounded-2xl text-white font-semibold"
            style={{ background: canContinue() ? "linear-gradient(135deg, #7c3aed, #ec4899)" : undefined }}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : currentStep === totalSteps ? (
              "Complete Check-In ✓"
            ) : (
              <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          HeadCheck is a reflective support tool, not a substitute for professional mental health care.
          If you are in crisis, please call or text <strong>988</strong>.
        </p>
      </div>
    </div>
  );
}
