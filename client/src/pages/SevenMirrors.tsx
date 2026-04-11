import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Brain, ArrowRight, ArrowLeft, Loader2, Sparkles, Award, Home } from "lucide-react";

const MIRRORS = [
  {
    index: 0, theme: "Values", emoji: "⚖️",
    title: "The Mirror of Values",
    prompt: "What are the 3 core values that guide your life? How well are you living in alignment with them right now?",
    description: "Reflect on what truly matters to you at your core.",
    color: "from-violet-50 to-purple-50",
    accent: "bg-violet-100 text-violet-700",
  },
  {
    index: 1, theme: "Loyalty", emoji: "🤝",
    title: "The Mirror of Loyalty",
    prompt: "Who are you most loyal to in your life? Is that loyalty balanced and healthy, or does it sometimes cost you your own peace?",
    description: "Explore the bonds that shape your sense of duty and belonging.",
    color: "from-blue-50 to-sky-50",
    accent: "bg-blue-100 text-blue-700",
  },
  {
    index: 2, theme: "Inner Conflict", emoji: "🌊",
    title: "The Mirror of Inner Conflict",
    prompt: "What internal battle are you fighting right now? What two parts of you are in tension, and what does each part need?",
    description: "Acknowledge the tensions within yourself with compassion.",
    color: "from-orange-50 to-amber-50",
    accent: "bg-orange-100 text-orange-700",
  },
  {
    index: 3, theme: "Self-Appreciation", emoji: "🌸",
    title: "The Mirror of Self-Appreciation",
    prompt: "What is one thing you genuinely admire about yourself that you rarely acknowledge? What strength have you been taking for granted?",
    description: "Celebrate your own light, however dimly you may see it today.",
    color: "from-pink-50 to-rose-50",
    accent: "bg-pink-100 text-pink-700",
  },
  {
    index: 4, theme: "Red Flags", emoji: "🚩",
    title: "The Mirror of Red Flags",
    prompt: "What patterns, behaviors, or situations in your life are warning signs that you've been ignoring? What is your gut telling you?",
    description: "Look honestly at what you've been avoiding seeing.",
    color: "from-red-50 to-rose-50",
    accent: "bg-red-100 text-red-700",
  },
  {
    index: 5, theme: "Growth", emoji: "🌱",
    title: "The Mirror of Growth",
    prompt: "Where have you grown the most in the past year? What challenges shaped you, and what wisdom did you gain from them?",
    description: "Honor your journey and the person you are becoming.",
    color: "from-green-50 to-emerald-50",
    accent: "bg-green-100 text-green-700",
  },
  {
    index: 6, theme: "Peace", emoji: "🕊️",
    title: "The Mirror of Peace",
    prompt: "What would it feel like to be truly at peace — with yourself, your past, and your present? What one thing would you need to release to get there?",
    description: "Envision the stillness that lives within you.",
    color: "from-sky-50 to-cyan-50",
    accent: "bg-sky-100 text-sky-700",
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

  const startMutation = trpc.sevenMirrors.startSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setCurrentMirrorIndex(data.currentMirrorIndex);
      setPhase("session");
    },
    onError: () => toast.error("Could not start session. Please try again."),
  });

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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAuthenticated) { navigate("/"); return null; }

  const currentMirror = MIRRORS[currentMirrorIndex];

  // ── Intro Phase ──────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/80 backdrop-blur-sm">
          <div className="container flex items-center justify-between h-16">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Brain className="w-5 h-5 text-primary" /><span className="font-semibold text-sm">HeadCheck AI</span>
            </button>
            <Badge variant="secondary">Seven Mirrors</Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><Home className="w-4 h-4 mr-1" /> Dashboard</Button>
          </div>
        </div>
        <div className="container max-w-3xl py-16 space-y-12">
          <div className="text-center animate-fade-in-up">
            <div className="text-6xl mb-4">🪞</div>
            <Badge variant="secondary" className="mb-4">Deep Reflection Journey</Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">The Seven Mirrors</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              A guided introspective journey through seven dimensions of your inner world. Take your time — there are no right or wrong answers.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MIRRORS.map((m) => (
              <div key={m.index} className={`rounded-2xl p-4 bg-gradient-to-br ${m.color} border border-white/60 text-center`}>
                <div className="text-2xl mb-1">{m.emoji}</div>
                <p className="text-xs font-semibold text-foreground">{m.theme}</p>
              </div>
            ))}
          </div>
          <div className="bg-card rounded-2xl p-6 border shadow-sm space-y-3">
            <h3 className="font-semibold text-foreground">Before you begin</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find a quiet space. Breathe deeply. This journey takes approximately 15–20 minutes. You can pause and resume at any time. Your responses are private and will be used to generate a personalized AI summary and theme badges.
            </p>
          </div>
          <Button size="lg" className="w-full h-14 text-base" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            {startMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            Begin the Journey
          </Button>
        </div>
      </div>
    );
  }

  // ── Session Phase ────────────────────────────────────────────────────────────
  if (phase === "session" && currentMirror) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex items-center justify-between h-16">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Brain className="w-5 h-5 text-primary" /><span className="font-semibold text-sm">HeadCheck AI</span>
            </button>
            <div className="flex items-center gap-1.5">
              {MIRRORS.map((m) => (
                <div key={m.index} className={`h-2 rounded-full transition-all duration-300 ${
                  m.index === currentMirrorIndex ? "w-8 bg-primary" : m.index < currentMirrorIndex ? "w-4 bg-primary/50" : "w-4 bg-muted"
                }`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium">Mirror {currentMirrorIndex + 1} of 7</span>
          </div>
        </div>
        <div className="container max-w-2xl py-12 space-y-8 animate-fade-in-up">
          <div className={`rounded-3xl p-8 bg-gradient-to-br ${currentMirror.color} border border-white/60`}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{currentMirror.emoji}</div>
              <Badge className={currentMirror.accent}>{currentMirror.theme}</Badge>
              <h1 className="font-serif text-2xl font-bold text-foreground mt-3 mb-2">{currentMirror.title}</h1>
              <p className="text-sm text-muted-foreground italic">{currentMirror.description}</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/60">
              <p className="text-base text-foreground leading-relaxed font-medium">{currentMirror.prompt}</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-6 border shadow-sm space-y-4">
            <label className="text-sm font-medium text-muted-foreground">Your reflection</label>
            <Textarea
              placeholder="Take your time. Write honestly and freely..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-48 resize-none border-0 p-0 focus-visible:ring-0 text-base"
            />
          </div>
          <div className="flex gap-3">
            {currentMirrorIndex > 0 && (
              <Button variant="outline" className="h-12 px-6" onClick={() => { setCurrentMirrorIndex(i => i - 1); setResponse(""); }}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button
              className="flex-1 h-12 text-base"
              disabled={response.trim().length < 10 || submitMutation.isPending}
              onClick={() => {
                if (!sessionId) return;
                submitMutation.mutate({ sessionId, mirrorIndex: currentMirrorIndex, response: response.trim() });
              }}
            >
              {submitMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {currentMirrorIndex === 6 ? "Generating summary..." : "Saving..."}</>
              ) : currentMirrorIndex === 6 ? (
                <><Sparkles className="w-4 h-4 mr-2" /> Complete Journey</>
              ) : (
                <>Next Mirror <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Complete Phase ───────────────────────────────────────────────────────────
  if (phase === "complete" && completionData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/80 backdrop-blur-sm">
          <div className="container flex items-center justify-between h-16">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Brain className="w-5 h-5 text-primary" /><span className="font-semibold text-sm">HeadCheck AI</span>
            </button>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">Journey Complete</Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><Home className="w-4 h-4 mr-1" /> Dashboard</Button>
          </div>
        </div>
        <div className="container max-w-2xl py-12 space-y-8 animate-fade-in-up">
          <div className="text-center">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Your Inner Journey Complete</h1>
            <p className="text-muted-foreground">You've looked into all seven mirrors. Here is what the AI sees in you.</p>
          </div>

          {/* Badges */}
          <div className="bg-card rounded-2xl p-6 border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-foreground">Your Theme Badges</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {completionData.badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                  <span className="text-sm">{MIRRORS[i]?.emoji}</span>
                  <span className="text-xs font-semibold text-amber-800">{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-card rounded-2xl p-6 border shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Your AI Reflection Summary</h2>
            </div>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
              {completionData.summary.split("\n\n").map((para, i) => (
                <p key={i} className="mb-3 last:mb-0">{para}</p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12" onClick={() => navigate("/check-in")}>New Check-In</Button>
            <Button className="h-12" onClick={() => navigate("/dashboard")}>
              <Home className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
