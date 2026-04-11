import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Compass, Sparkles, ArrowRight, Phone, LogIn, Loader2 } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

type GuestResult = {
  aiResponse: {
    emotionalReflection: string;
    brainInsight: string;
    eiPillar: string;
    eiPillarDescription: string;
    aieiProverb: string;
    aieiProverbOrigin: string;
    personalizedNextStep: string;
    supportInvitation: string;
    mochaAffirmation?: string;
  };
  crisisDetected: boolean;
  severity: string | null;
  emotion: string;
  emotionEmoji: string;
  intensity: number;
  context: string;
  journalEntry?: string;
};

const RESPONSE_SECTIONS = [
  {
    key: "emotionalReflection" as const,
    icon: "💜",
    title: "Emotional Reflection",
    gradient: "from-purple-50 to-violet-50",
    border: "border-purple-200",
    titleColor: "text-purple-700",
  },
  {
    key: "brainInsight" as const,
    icon: "🧠",
    title: "Brain Insight",
    gradient: "from-blue-50 to-sky-50",
    border: "border-blue-200",
    titleColor: "text-blue-700",
  },
  {
    key: "aieiProverb" as const,
    icon: "🌍",
    title: "African Wisdom (AIEI)",
    gradient: "from-amber-50 to-orange-50",
    border: "border-amber-200",
    titleColor: "text-amber-700",
  },
  {
    key: "personalizedNextStep" as const,
    icon: "🌱",
    title: "Your Next Step",
    gradient: "from-green-50 to-emerald-50",
    border: "border-green-200",
    titleColor: "text-green-700",
  },
  {
    key: "supportInvitation" as const,
    icon: "🤝",
    title: "Support Invitation",
    gradient: "from-rose-50 to-pink-50",
    border: "border-rose-200",
    titleColor: "text-rose-700",
  },
  {
    key: "mochaAffirmation" as const,
    icon: "✨",
    title: "Mocha's Affirmation",
    gradient: "from-violet-50 to-pink-50",
    border: "border-violet-200",
    titleColor: "text-violet-700",
    isAffirmation: true,
  },
];

export default function GuestCheckInResult() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<GuestResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("headcheck_guest_result");
    if (!raw) {
      navigate("/checkin");
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      navigate("/checkin");
    }
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.97_0.03_285)]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.45 0.18 285)" }} />
      </div>
    );
  }

  const { aiResponse, crisisDetected, emotion, emotionEmoji, intensity, context } = result;

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.03_285)]">

      <NavBar />

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16 space-y-6">

        {/* Crisis Alert */}
        {crisisDetected && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex gap-4 items-start">
            <div className="text-2xl">🆘</div>
            <div>
              <p className="font-bold text-red-700 mb-1">You're not alone — support is available 24/7</p>
              <p className="text-sm text-red-600 mb-3">If you're in crisis, please reach out immediately.</p>
              <button onClick={() => window.open("tel:988")}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-red-700 transition-colors">
                <Phone className="w-4 h-4" /> Call or Text 988 Now
              </button>
            </div>
          </div>
        )}

        {/* Emotion Summary */}
        <div className="bg-white rounded-2xl p-6 border shadow-sm text-center" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
          <div className="text-5xl mb-3">{emotionEmoji}</div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.18 0.04 260)" }}>
            Feeling <span style={{ color: "oklch(0.45 0.18 285)" }}>{emotion}</span>
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 260)" }}>
            Intensity {intensity}/10 · Context: {context}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "oklch(0.94 0.04 285)", color: "oklch(0.35 0.18 285)" }}>
            <Sparkles className="w-4 h-4" />
            EI Pillar: {aiResponse.eiPillar}
          </div>
        </div>

        {/* EI Pillar Description */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5" style={{ color: "oklch(0.45 0.18 285)" }} />
            <span className="font-semibold text-sm" style={{ color: "oklch(0.45 0.18 285)" }}>EI Pillar: {aiResponse.eiPillar}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.04 260)" }}>{aiResponse.eiPillarDescription}</p>
        </div>

        {/* Main Response Sections */}
        {RESPONSE_SECTIONS.map((section) => {
          const value = aiResponse[section.key];
          if (!value) return null;
          return (
            <div key={section.key} className={`bg-gradient-to-br ${section.gradient} rounded-2xl p-5 border ${section.border} shadow-sm`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{section.icon}</span>
                <h3 className={`font-bold text-sm ${section.titleColor}`}>{section.title}</h3>
              </div>
              {section.key === "aieiProverb" ? (
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.22 0.04 260)" }}>
                  <em className="block text-base font-medium mb-1">"{aiResponse.aieiProverb}"</em>
                  <span className="text-xs opacity-70">— {aiResponse.aieiProverbOrigin}</span>
                </p>
              ) : (section as any).isAffirmation ? (
                <div className="text-center py-2">
                  <p className="font-serif text-xl font-semibold leading-relaxed" style={{ color: "oklch(0.45 0.18 285)" }}>✨ {value}</p>
                  <p className="text-xs opacity-60 mt-3">— Mocha, your HeadCheck companion</p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.22 0.04 260)" }}>{value}</p>
              )}
            </div>
          );
        })}

        {/* ── SAVE YOUR PROGRESS NUDGE ── */}
        <div className="rounded-2xl p-6 text-center border-2 space-y-4"
          style={{ background: "linear-gradient(135deg, oklch(0.95 0.04 285), oklch(0.96 0.04 48))", borderColor: "oklch(0.88 0.06 285)" }}>
          <div className="text-3xl">✨</div>
          <h3 className="text-lg font-bold" style={{ color: "oklch(0.18 0.04 260)" }}>Save your progress & build your journey</h3>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.45 0.04 260)" }}>
            Create a free account to track your emotional history, earn streak badges, access the Self Trust Compass, and see your growth over time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.location.href = getLoginUrl()} className="rounded-full px-6 font-semibold"
              style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}>
              <LogIn className="w-4 h-4 mr-2" /> Create Free Account
            </Button>
            <Button variant="outline" className="rounded-full px-6" onClick={() => navigate("/checkin")}>
              Try Another Check-In
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => navigate("/compass")}
            className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all"
            style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <Compass className="w-6 h-6" style={{ color: "oklch(0.45 0.18 285)" }} />
            <span className="text-sm font-semibold" style={{ color: "oklch(0.22 0.04 260)" }}>Self Trust Compass</span>
            <span className="text-xs" style={{ color: "oklch(0.55 0.04 260)" }}>Deep reflection journey</span>
          </button>
          <button onClick={() => navigate("/resources")}
            className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all"
            style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <span className="text-2xl">📚</span>
            <span className="text-sm font-semibold" style={{ color: "oklch(0.22 0.04 260)" }}>Resources</span>
            <span className="text-xs" style={{ color: "oklch(0.55 0.04 260)" }}>EI tools & articles</span>
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center leading-relaxed pb-4 px-4" style={{ color: "oklch(0.60 0.03 260)" }}>
          HeadCheck AI is a reflective support tool, not a substitute for professional mental health care. If you are in crisis, please call or text <strong>988</strong> (Suicide & Crisis Lifeline).
        </p>
      </div>
      <Footer />
    </div>
  );
}
