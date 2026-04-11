import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Heart, ArrowRight, ArrowLeft, Loader2, Sparkles, Award, LogIn } from "lucide-react";
import { getLoginUrl } from "@/const";

// Updated mirror themes from headcheck.app — Self Trust Compass
const MIRRORS = [
  {
    index: 0, theme: "Self-Awareness", emoji: "🪞",
    title: "Mirror of Self-Awareness",
    question: "How well do you know yourself?",
    prompt: "Reflect on a recent moment when you were surprised by your own reaction. What did it reveal about you that you hadn't fully recognized before?",
    color: "from-violet-50 to-purple-50",
    accent: "bg-violet-100 text-violet-700",
  },
  {
    index: 1, theme: "Self-Compassion", emoji: "💛",
    title: "Mirror of Self-Compassion",
    question: "How kind are you to yourself?",
    prompt: "Think about how you speak to yourself when you make a mistake. Would you speak that way to a close friend? What would a kinder inner voice sound like?",
    color: "from-yellow-50 to-amber-50",
    accent: "bg-yellow-100 text-yellow-700",
  },
  {
    index: 2, theme: "Boundaries", emoji: "🛡️",
    title: "Mirror of Boundaries",
    question: "Can you honor your needs?",
    prompt: "Reflect on a time when you said yes but meant no, or when you felt your boundaries weren't respected. What made it difficult to honor your own needs?",
    color: "from-green-50 to-emerald-50",
    accent: "bg-green-100 text-green-700",
  },
  {
    index: 3, theme: "Authenticity", emoji: "✨",
    title: "Mirror of Authenticity",
    question: "Are you true to yourself?",
    prompt: "In what areas of your life do you feel most like yourself? Where do you feel you're playing a role? What would it look like to show up more authentically?",
    color: "from-orange-50 to-amber-50",
    accent: "bg-orange-100 text-orange-700",
  },
  {
    index: 4, theme: "Decision-Making", emoji: "🧭",
    title: "Mirror of Decision-Making",
    question: "Do you trust your choices?",
    prompt: "Recall a decision you made recently. Did you trust your own judgment, or did you seek external validation? What does trusting yourself in decisions feel like?",
    color: "from-blue-50 to-sky-50",
    accent: "bg-blue-100 text-blue-700",
  },
  {
    index: 5, theme: "Resilience", emoji: "🌱",
    title: "Mirror of Resilience",
    question: "How do you handle setbacks?",
    prompt: "Think of a recent challenge or setback. How did you respond? What inner resources did you draw on, and what would you do differently with more self-trust?",
    color: "from-teal-50 to-cyan-50",
    accent: "bg-teal-100 text-teal-700",
  },
  {
    index: 6, theme: "Growth Mindset", emoji: "🚀",
    title: "Mirror of Growth Mindset",
    question: "How do you view your potential?",
    prompt: "Where do you feel stuck in your growth? What beliefs about yourself might be limiting you? What would become possible if you truly believed in your own potential?",
    color: "from-pink-50 to-rose-50",
    accent: "bg-pink-100 text-pink-700",
  },
];

type Phase = "intro" | "session" | "complete";

export default function SevenMirrors() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentMirrorIndex, setCurrentMirrorIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [completionData, setCompletionData] = useState<{ summary: string; badges: string[] } | null>(null);

  // Guest: in-memory responses array
  const [guestResponses, setGuestResponses] = useState<{ mirrorTheme: string; response: string }[]>([]);

  // Authenticated: start session in DB
  const startMutation = trpc.sevenMirrors.startSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setCurrentMirrorIndex(data.currentMirrorIndex);
      setPhase("session");
    },
    onError: () => toast.error("Could not start session. Please try again."),
  });

  // Authenticated: submit each mirror response to DB
  const submitMutation = trpc.sevenMirrors.submitMirrorResponse.useMutation({
    onSuccess: (data) => {
      if (data.completed) {
        setCompletionData({ summary: data.summary!, badges: data.badges! });
        setPhase("complete");
      } else {
        setCurrentMirrorIndex(data.nextMirrorIndex!);
        setResponse("");
      }
    },
    onError: () => toast.error("Could not save your response. Please try again."),
  });

  // Guest: generate AI summary without saving to DB
  const guestSummaryMutation = trpc.sevenMirrors.guestSummary.useMutation({
    onSuccess: (data) => {
      setCompletionData({ summary: data.summary, badges: data.badges });
      setPhase("complete");
    },
    onError: () => toast.error("Could not generate summary. Please try again."),
  });

  const handleStart = () => {
    if (isAuthenticated) {
      startMutation.mutate();
    } else {
      setGuestResponses([]);
      setCurrentMirrorIndex(0);
      setPhase("session");
    }
  };

  const handleSubmitMirror = () => {
    const currentMirror = MIRRORS[currentMirrorIndex];
    if (!currentMirror) return;
    const trimmed = response.trim();
    if (isAuthenticated && sessionId) {
      submitMutation.mutate({ sessionId, mirrorIndex: currentMirrorIndex, response: trimmed });
    } else {
      // Guest: accumulate in memory
      const updated = [...guestResponses, { mirrorTheme: currentMirror.theme, response: trimmed }];
      setGuestResponses(updated);
      if (currentMirrorIndex === 6) {
        // Last mirror — generate AI summary
        guestSummaryMutation.mutate({ responses: updated });
      } else {
        setCurrentMirrorIndex(i => i + 1);
        setResponse("");
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.45 0.18 285)" }} /></div>;

  const currentMirror = MIRRORS[currentMirrorIndex];

  // ── INTRO ──
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-[oklch(0.97_0.03_285)]">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[oklch(0.90_0.04_285)]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl" style={{ color: "oklch(0.45 0.18 285)" }}>
              <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
              HeadCheck
            </button>
            <Badge variant="secondary">Self Trust Compass</Badge>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-6 pt-28 pb-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border text-sm font-medium mb-6 shadow-sm"
            style={{ borderColor: "oklch(0.88 0.06 285)", color: "oklch(0.45 0.18 285)" }}>
            🧭 A Journey Inward
          </div>

          {/* Gradient bar */}
          <div className="w-full h-3 rounded-full mb-6"
            style={{ background: "linear-gradient(to right, oklch(0.55 0.22 285), oklch(0.65 0.20 340), oklch(0.72 0.18 48), oklch(0.75 0.16 120))" }} />

          <h1 className="text-3xl font-black mb-3" style={{ color: "oklch(0.18 0.04 260)" }}>The Self Trust Compass</h1>
          <p className="leading-relaxed mb-8" style={{ color: "oklch(0.45 0.04 260)" }}>
            A seven mirror self-reflection practice that helps you check in on how you relate to yourself. Each mirror points inward asking not what is wrong, but <em>what is true</em>.
          </p>

          {/* What to Expect */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border text-left mb-5" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <h2 className="font-bold mb-4" style={{ color: "oklch(0.18 0.04 260)" }}>What to Expect</h2>
            <ul className="space-y-3">
              {[
                <><strong>Seven mirrors</strong> exploring your relationship with yourself</>,
                <><strong>10-15 minutes</strong> of guided reflection</>,
                <><strong>No right answers</strong>, only honest ones</>,
                <><strong>Your responses</strong> help you see patterns and growth areas</>,
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-start text-sm" style={{ color: "oklch(0.35 0.04 260)" }}>
                  <span className="font-bold mt-0.5" style={{ color: "oklch(0.45 0.18 285)" }}>✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mirror grid preview */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {MIRRORS.map((m) => (
              <div key={m.index} className={`rounded-xl p-3 bg-gradient-to-br ${m.color} border border-white/60 text-left`}>
                <span className="text-xl">{m.emoji}</span>
                <p className="text-xs font-semibold mt-1" style={{ color: "oklch(0.18 0.04 260)" }}>{m.theme}</p>
                <p className="text-xs italic" style={{ color: "oklch(0.55 0.04 260)" }}>{m.question}</p>
              </div>
            ))}
          </div>

          {/* Best practiced when */}
          <div className="rounded-xl p-4 text-sm text-left mb-8" style={{ background: "oklch(0.96 0.03 285)", color: "oklch(0.45 0.04 260)" }}>
            <strong style={{ color: "oklch(0.18 0.04 260)" }}>Best practiced when:</strong> You're not in crisis, have time to reflect deeply, and are curious about your inner landscape. This is different from the quick check-in—it's for deeper exploration.
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full rounded-full py-6 text-base font-bold"
              style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
              onClick={handleStart} disabled={startMutation.isPending || guestSummaryMutation.isPending}>
              {startMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Begin Your Journey
            </Button>
            <Button onClick={() => navigate("/")} variant="ghost" className="w-full rounded-full" style={{ color: "oklch(0.55 0.04 260)" }}>
              Return Home
            </Button>
            <Button onClick={() => navigate("/checkin")} variant="outline" className="w-full rounded-full">
              Try Quick Check-In
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs mt-8 leading-relaxed" style={{ color: "oklch(0.60 0.03 260)" }}>
            This check-in is a reflective support tool. It is not a replacement for academic advising, counseling, or mental health services. If you are experiencing ongoing distress or feel unsafe, please contact your campus support services or emergency resources.
          </p>
        </div>
      </div>
    );
  }

  // ── SESSION ──
  if (phase === "session" && currentMirror) {
    return (
      <div className="min-h-screen bg-[oklch(0.97_0.03_285)]">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[oklch(0.90_0.04_285)]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl" style={{ color: "oklch(0.45 0.18 285)" }}>
              <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
              HeadCheck
            </button>
            <div className="flex items-center gap-1.5">
              {MIRRORS.map((m) => (
                <div key={m.index} className={`h-1.5 rounded-full transition-all duration-300 ${
                  m.index === currentMirrorIndex ? "w-8" : m.index < currentMirrorIndex ? "w-4 opacity-60" : "w-4 opacity-20"
                }`}
                  style={{ background: m.index <= currentMirrorIndex ? "linear-gradient(to right, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" : "oklch(0.80 0.03 260)" }} />
              ))}
            </div>
            <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.04 260)" }}>Mirror {currentMirrorIndex + 1} of 7</span>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-6 pt-28 pb-12 space-y-5">
          <div className={`rounded-3xl p-8 bg-gradient-to-br ${currentMirror.color} border border-white/60`}>
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">{currentMirror.emoji}</div>
              <Badge className={currentMirror.accent}>{currentMirror.theme}</Badge>
              <h1 className="text-2xl font-bold mt-3 mb-1" style={{ color: "oklch(0.18 0.04 260)" }}>{currentMirror.title}</h1>
              <p className="text-sm italic" style={{ color: "oklch(0.45 0.18 285)" }}>{currentMirror.question}</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/60">
              <p className="text-base leading-relaxed font-medium" style={{ color: "oklch(0.18 0.04 260)" }}>{currentMirror.prompt}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <label className="text-sm font-medium" style={{ color: "oklch(0.55 0.04 260)" }}>Your reflection</label>
            <Textarea
              placeholder="Take your time. Write honestly and freely..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-48 resize-none border-0 p-0 focus-visible:ring-0 text-base"
            />
          </div>

          <div className="flex gap-3">
            {currentMirrorIndex > 0 && (
              <Button variant="outline" className="h-12 px-6 rounded-full"
                onClick={() => { setCurrentMirrorIndex(i => i - 1); setResponse(""); }}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button className="flex-1 h-12 text-base rounded-full font-semibold"
              style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
              disabled={response.trim().length < 10 || submitMutation.isPending || guestSummaryMutation.isPending}
              onClick={handleSubmitMirror}>
              {(submitMutation.isPending || guestSummaryMutation.isPending) ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />{currentMirrorIndex === 6 ? "Generating summary..." : "Saving..."}</>
              ) : currentMirrorIndex === 6 ? (
                <><Sparkles className="w-4 h-4 mr-2" />Complete Journey</>
              ) : (
                <>Next Mirror <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-center leading-relaxed" style={{ color: "oklch(0.65 0.03 260)" }}>
            This check-in is a reflective support tool. It is not a replacement for counseling or mental health services.
          </p>
        </div>
      </div>
    );
  }

  // ── COMPLETE ──
  if (phase === "complete" && completionData) {
    return (
      <div className="min-h-screen bg-[oklch(0.97_0.03_285)]">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[oklch(0.90_0.04_285)]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl" style={{ color: "oklch(0.45 0.18 285)" }}>
              <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
              HeadCheck
            </button>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">Journey Complete</Badge>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-6 pt-28 pb-12 text-center space-y-6">
          <div className="text-6xl">✨</div>
          <div>
            <h1 className="text-3xl font-black mb-2" style={{ color: "oklch(0.18 0.04 260)" }}>Journey Complete</h1>
            <p style={{ color: "oklch(0.55 0.04 260)" }}>You've completed all seven mirrors of the Self Trust Compass.</p>
          </div>

          {completionData.badges.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border text-left" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold" style={{ color: "oklch(0.18 0.04 260)" }}>Badges Earned</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {completionData.badges.map((b) => (
                  <Badge key={b} className="bg-amber-100 text-amber-700 px-3 py-1">{b}</Badge>
                ))}
              </div>
            </div>
          )}

          {completionData.summary && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border text-left" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5" style={{ color: "oklch(0.45 0.18 285)" }} />
                <h2 className="font-bold" style={{ color: "oklch(0.18 0.04 260)" }}>Your Reflection Summary</h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.35 0.04 260)" }}>{completionData.summary}</p>
            </div>
          )}

          {/* Guest: soft login nudge */}
          {!isAuthenticated && (
            <div className="rounded-2xl p-6 text-center border-2 space-y-3"
              style={{ background: "linear-gradient(135deg, oklch(0.95 0.04 285), oklch(0.96 0.04 48))", borderColor: "oklch(0.88 0.06 285)" }}>
              <div className="text-2xl">✨</div>
              <h3 className="font-bold" style={{ color: "oklch(0.18 0.04 260)" }}>Save your journey & track your growth</h3>
              <p className="text-sm" style={{ color: "oklch(0.45 0.04 260)" }}>Create a free account to save your Compass sessions, earn badges, and track emotional patterns over time.</p>
              <Button onClick={() => window.location.href = getLoginUrl()} className="w-full rounded-full font-semibold"
                style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}>
                <LogIn className="w-4 h-4 mr-2" /> Create Free Account
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} className="w-full rounded-full font-semibold"
                style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}>
                View Your Dashboard
              </Button>
            ) : null}
            <Button onClick={() => navigate("/checkin")} variant="outline" className="w-full rounded-full">
              Start a Quick Check-In
            </Button>
            <Button onClick={() => navigate("/")} variant="ghost" className="w-full rounded-full" style={{ color: "oklch(0.55 0.04 260)" }}>
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
