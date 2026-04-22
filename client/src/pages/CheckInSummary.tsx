import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { Heart, Sparkles, ArrowRight, CheckCircle2, Users, Loader2 } from "lucide-react";
import { InterventionResult } from "@/components/InterventionResult";
import { CrisisScreen } from "@/components/CrisisScreen";

// ── Types ────────────────────────────────────────────────────────────────────────────────
export interface CheckInSummaryData {
  primaryEmotion: string;
  stressors: string[];
  supportNeed: string;
  possibleAction: string;
  supportType: string;
  wantsSave: boolean;
  checkInId?: number;
  guestResult?: unknown;
  intervention?: {
    tier: "green" | "yellow" | "red";
    tierLabel: string;
    tierColor: string;
    scores: { emotionalIntensityScore: number; stressLoadScore: number; readinessScore: number; totalScore: number };
    riskOverride: boolean;
    riskLevel: "none" | "crisis";
    stabilization: { message: string; subtext: string; breathingPrompt?: string };
    redirection: { nextStep: string; nextStepReason: string; actionLabel: string; actionUrl?: string };
    escalationTriggered: boolean;
    escalationReason?: string;
    interventionSessionId?: number;
  } | null;
}

// ─── Helper: generate human-readable summary lines ───────────────────────────
function summariseEmotion(emotion: string): string {
  const map: Record<string, string> = {
    overwhelmed: "feeling overwhelmed and under pressure",
    anxious: "experiencing anxiety and worry",
    stressed: "carrying significant stress right now",
    sad: "feeling sad and emotionally heavy",
    angry: "holding frustration or anger",
    discouraged: "feeling discouraged and low on energy",
    numb: "feeling disconnected or emotionally numb",
    confused: "feeling uncertain and unclear",
    frustrated: "experiencing frustration",
    "hopeful but uncertain": "feeling hopeful yet uncertain about the path ahead",
  };
  return map[emotion.toLowerCase()] ?? `feeling ${emotion.toLowerCase()}`;
}

function summariseStressors(stressors: string[]): string {
  if (!stressors.length) return "a combination of pressures";
  if (stressors.length === 1) return stressors[0].toLowerCase();
  if (stressors.length === 2) return `${stressors[0].toLowerCase()} and ${stressors[1].toLowerCase()}`;
  return `${stressors.slice(0, 2).map(s => s.toLowerCase()).join(", ")}, and ${stressors.length - 2} other factor${stressors.length - 2 > 1 ? "s" : ""}`;
}

// ── Component ────────────────────────────────────────────────────────────────────────────────
export default function CheckInSummary() {
  const [, navigate] = useLocation();
  // "crisis" | "intervention" | "summary"
  const [screen, setScreen] = useState<"crisis" | "intervention" | "summary">("summary");

  // Read data passed via sessionStorage (set by CheckIn.tsx before navigating)
  const raw = sessionStorage.getItem("headcheck_summary");
  const data: CheckInSummaryData | null = raw ? JSON.parse(raw) : null;

  // Determine initial screen based on intervention result
  const [initialized, setInitialized] = useState(false);
  if (!initialized && data) {
    setInitialized(true);
    if (data.intervention?.riskOverride) {
      setScreen("crisis");
    } else if (data.intervention && data.intervention.tier !== "green") {
      setScreen("intervention");
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f5f0ff 0%, #fff5f5 50%, #fff8f0 100%)" }}>
        <NavBar />
        <div className="text-center mt-24">
          <p className="text-gray-500 mb-4">No check-in data found.</p>
          <Button onClick={() => navigate("/checkin")} className="rounded-2xl">Start a Check-In</Button>
        </div>
      </div>
    );
  }

  const handleViewInsights = () => {
    sessionStorage.removeItem("headcheck_summary");
    if (data.checkInId) {
      navigate(`/checkin/result/${data.checkInId}`);
    } else {
      navigate("/checkin/guest-result");
    }
  };

  const handleNewCheckIn = () => {
    sessionStorage.removeItem("headcheck_summary");
    navigate("/checkin");
  };

  const supportSelected = data.supportType && data.supportType !== "Not sure yet" && data.supportType !== "Not ready yet";

  // ── Crisis Screen ───────────────────────────────────────────────────────────────────────────────
  if (screen === "crisis") {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #fff 50%, #f0f9ff 100%)" }}>
        <NavBar />
        <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
          <CrisisScreen
            onStayWithMe={() => setScreen("summary")}
            onContinue={() => setScreen(data.intervention ? "intervention" : "summary")}
          />
        </div>
      </div>
    );
  }

  // ── Intervention Result Screen ─────────────────────────────────────────────────────────────────────────
  if (screen === "intervention" && data.intervention) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
          <InterventionResult
            intervention={data.intervention}
            onContinue={() => setScreen("summary")}
            onEscalation={() => setScreen("summary")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f0ff 0%, #fff5f5 50%, #fff8f0 100%)" }}>
      <NavBar />
      <div className="max-w-lg mx-auto px-4 pt-24 pb-12">      {/* Saved confirmation banner */}
        {data.wantsSave && data.checkInId && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">Your check-in has been saved.</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ background: "linear-gradient(135deg, #ede9fe, #fce7f3)", color: "#7c3aed" }}>
            <Heart className="w-4 h-4" /> Check-In Complete
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Here is what you shared</h1>
          <p className="text-gray-500 text-sm">Take a moment to read this before your AI insights.</p>
        </div>

        {/* ── Card 1: What you may be feeling ─────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ede9fe, #fce7f3)" }}>
              <span className="text-lg">💜</span>
            </div>
            <h3 className="font-semibold text-gray-900">What you may be feeling</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Right now, it sounds like you are{" "}
            <strong>{summariseEmotion(data.primaryEmotion)}</strong>.
            That is a real and valid experience.
          </p>
        </div>

        {/* ── Card 2: What may be affecting you ───────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)" }}>
              <span className="text-lg">🌿</span>
            </div>
            <h3 className="font-semibold text-gray-900">What may be affecting you</h3>
          </div>
          {data.stressors.length > 0 ? (
            <>
              <p className="text-gray-700 leading-relaxed mb-3">
                You identified <strong>{summariseStressors(data.stressors)}</strong> as contributing factors.
              </p>
              <div className="flex flex-wrap gap-2">
                {data.stressors.slice(0, 5).map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                    {s}
                  </span>
                ))}
                {data.stressors.length > 5 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    +{data.stressors.length - 5} more
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">You did not identify specific stressors — that is okay.</p>
          )}
        </div>

        {/* ── Card 3: What seems most supportive ──────────────────────────── */}
        {data.supportNeed && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-teal-100 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0fdfa, #ccfbf1)" }}>
                <span className="text-lg">🌊</span>
              </div>
              <h3 className="font-semibold text-gray-900">What seems most supportive</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              You said <strong>{data.supportNeed.toLowerCase()}</strong> would feel most helpful right now.
            </p>
          </div>
        )}

        {/* ── Card 4: Your next step ───────────────────────────────────────── */}
        {data.possibleAction && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-violet-100 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ede9fe, #e0e7ff)" }}>
                <span className="text-lg">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900">Your next step</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              You chose: <strong>{data.possibleAction}</strong>.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              One small step is enough. You do not need to solve everything today.
            </p>
          </div>
        )}

        {/* ── Card 5: Support reminder ─────────────────────────────────────── */}
        {supportSelected && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fce7f3, #ffe4e6)" }}>
                <Users className="w-5 h-5 text-pink-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Support reminder</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              You mentioned <strong>{data.supportType.toLowerCase()}</strong> as a potential source of support.
            </p>
            <p className="text-sm text-pink-700 font-medium mt-2">
              Reaching out is a strength, not a weakness.
            </p>
          </div>
        )}

        {/* ── Gentle reminder card ─────────────────────────────────────────── */}
        <div className="rounded-3xl p-5 mb-8 text-center" style={{ background: "linear-gradient(135deg, #f5f0ff, #fff5f5)" }}>
          <p className="text-gray-600 text-sm leading-relaxed italic">
            You may not need to solve everything today. You may only need to name what is real,
            choose what is possible, and let support meet you there.
          </p>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <Button
            className="w-full h-14 rounded-2xl text-white font-semibold text-base"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            onClick={handleViewInsights}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            View Your AI Insights
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl border-2 border-gray-200 font-medium"
            onClick={handleNewCheckIn}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Start Another Check-In
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          HeadCheck is a reflective support tool, not a substitute for professional mental health care.
        </p>
      </div>
    </div>
  );
}
