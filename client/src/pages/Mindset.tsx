import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, RefreshCw, Heart, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const AFFIRMATIONS = [
  { text: "I am capable of handling whatever comes my way today.", category: "Resilience" },
  { text: "My emotions are valid. I honor them without being controlled by them.", category: "Self-Awareness" },
  { text: "I choose to respond with intention, not react with impulse.", category: "Self-Regulation" },
  { text: "I am worthy of care, rest, and support.", category: "Self-Compassion" },
  { text: "Every challenge I face is an opportunity to grow stronger.", category: "Growth" },
  { text: "I trust my ability to navigate uncertainty with grace.", category: "Resilience" },
  { text: "I am connected to a community that lifts me up.", category: "Ubuntu" },
  { text: "My story matters. My voice matters. I matter.", category: "Self-Worth" },
  { text: "I release what I cannot control and focus on what I can.", category: "Self-Regulation" },
  { text: "I am becoming the best version of myself, one day at a time.", category: "Growth" },
  { text: "I have the courage to ask for help when I need it.", category: "Vulnerability" },
  { text: "My feelings are messengers, not enemies.", category: "Self-Awareness" },
  { text: "I bring value to every space I enter.", category: "Self-Worth" },
  { text: "I am rooted in my values and open to new possibilities.", category: "Authenticity" },
  { text: "Peace is available to me in this moment, right now.", category: "Mindfulness" },
];

const PROVERBS = [
  { text: "Hurry, hurry has no blessing.", origin: "Swahili", lesson: "Slow down. Presence is power." },
  { text: "I am because we are.", origin: "Ubuntu Philosophy", lesson: "Your wellbeing is connected to the wellbeing of others." },
  { text: "Little by little, a little becomes a lot.", origin: "Tanzanian", lesson: "Small consistent steps create lasting transformation." },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", origin: "African", lesson: "Seek community. Growth is a collective journey." },
  { text: "A single hand cannot tie a bundle.", origin: "African", lesson: "Asking for help is a sign of wisdom, not weakness." },
  { text: "Until the lion learns to write, every story will glorify the hunter.", origin: "African", lesson: "Own your narrative. Tell your own story." },
  { text: "Rain does not fall on one roof alone.", origin: "Cameroonian", lesson: "You are not alone in your struggles." },
  { text: "The child who is not embraced by the village will burn it down to feel its warmth.", origin: "African", lesson: "Every person needs to feel seen, valued, and included." },
  { text: "Speak softly and carry a big stick.", origin: "West African", lesson: "Emotional strength is quiet and steady." },
  { text: "Knowledge is like a garden: if it is not cultivated, it cannot be harvested.", origin: "African", lesson: "Your emotional intelligence grows through daily practice." },
];

const BREATHING_STEPS = [
  { label: "Inhale", duration: 4, color: "bg-blue-400" },
  { label: "Hold", duration: 4, color: "bg-violet-400" },
  { label: "Exhale", duration: 4, color: "bg-green-400" },
  { label: "Hold", duration: 4, color: "bg-amber-400" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Resilience: "bg-blue-100 text-blue-700",
  "Self-Awareness": "bg-violet-100 text-violet-700",
  "Self-Regulation": "bg-teal-100 text-teal-700",
  "Self-Compassion": "bg-rose-100 text-rose-700",
  Growth: "bg-green-100 text-green-700",
  Ubuntu: "bg-amber-100 text-amber-700",
  "Self-Worth": "bg-orange-100 text-orange-700",
  Vulnerability: "bg-pink-100 text-pink-700",
  Authenticity: "bg-indigo-100 text-indigo-700",
  Mindfulness: "bg-cyan-100 text-cyan-700",
};

export default function Mindset() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [affirmationIndex, setAffirmationIndex] = useState(() => Math.floor(Math.random() * AFFIRMATIONS.length));
  const [proverbIndex, setProverbIndex] = useState(() => Math.floor(Math.random() * PROVERBS.length));
  const [breathStep, setBreathStep] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathProgress, setBreathProgress] = useState(0);
  const [liked, setLiked] = useState(false);

  const affirmation = AFFIRMATIONS[affirmationIndex];
  const proverb = PROVERBS[proverbIndex];

  // Get day-of-year for consistent daily affirmation
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyAffirmation = AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
  const dailyProverb = PROVERBS[dayOfYear % PROVERBS.length];

  useEffect(() => {
    if (!isBreathing) return;
    const step = BREATHING_STEPS[breathStep];
    const interval = setInterval(() => {
      setBreathProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          const next = (breathStep + 1) % BREATHING_STEPS.length;
          setBreathStep(next);
          setBreathProgress(0);
          return 0;
        }
        return p + (100 / (step.duration * 10));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isBreathing, breathStep]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg hc-gradient-orange flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm">HeadCheck AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="hc-gradient-warm py-12">
        <div className="container max-w-2xl text-center space-y-3">
          <div className="text-5xl">✨</div>
          <h1 className="font-serif text-4xl font-bold text-foreground">Mindset</h1>
          <p className="text-muted-foreground">Daily affirmations, African wisdom, and breathing exercises to ground your mind and elevate your spirit.</p>
        </div>
      </div>

      <div className="container max-w-2xl py-10 space-y-6">

        {/* Daily Affirmation Card */}
        <div className="bg-white rounded-3xl border-2 border-orange-100 shadow-md p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Affirmation</p>
              <p className="text-xs text-muted-foreground">{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>
            <Badge className={CATEGORY_COLORS[dailyAffirmation.category] || "bg-muted text-muted-foreground"}>
              {dailyAffirmation.category}
            </Badge>
          </div>
          <p className="font-serif text-2xl font-bold text-foreground leading-snug">"{dailyAffirmation.text}"</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 ${liked ? "text-rose-500 border-rose-200 bg-rose-50" : ""}`}
              onClick={() => setLiked(!liked)}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-rose-500" : ""}`} /> {liked ? "Saved" : "Save"}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setAffirmationIndex(Math.floor(Math.random() * AFFIRMATIONS.length))}>
              <RefreshCw className="w-3.5 h-3.5" /> New Affirmation
            </Button>
          </div>
        </div>

        {/* Daily African Proverb */}
        <div className="bg-amber-50 rounded-3xl border border-amber-200 p-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">African Wisdom (AIEI)</p>
              <p className="text-xs text-amber-600">Daily Proverb</p>
            </div>
          </div>
          <p className="font-serif text-xl font-bold text-amber-900 italic">"{dailyProverb.text}"</p>
          <p className="text-sm text-amber-700">— {dailyProverb.origin}</p>
          <div className="bg-white/60 rounded-xl p-3 border border-amber-100">
            <p className="text-xs font-semibold text-amber-800 mb-1">💡 Reflection</p>
            <p className="text-sm text-amber-800">{dailyProverb.lesson}</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-amber-700 hover:bg-amber-100" onClick={() => setProverbIndex(Math.floor(Math.random() * PROVERBS.length))}>
            <RefreshCw className="w-3.5 h-3.5" /> New Proverb
          </Button>
        </div>

        {/* Box Breathing Exercise */}
        <div className="bg-white rounded-3xl border shadow-sm p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="text-xl">🌬️</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Box Breathing</h3>
              <p className="text-xs text-muted-foreground">4-4-4-4 technique to calm your nervous system</p>
            </div>
          </div>

          {isBreathing ? (
            <div className="text-center space-y-4">
              <div className="relative w-32 h-32 mx-auto">
                <div className={`absolute inset-0 rounded-full ${BREATHING_STEPS[breathStep].color} opacity-20 animate-pulse`} />
                <div
                  className={`absolute inset-0 rounded-full ${BREATHING_STEPS[breathStep].color} opacity-60 transition-all duration-100`}
                  style={{ transform: `scale(${0.4 + (breathProgress / 100) * 0.6})` }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-bold text-white text-lg">{BREATHING_STEPS[breathStep].label}</p>
                  <p className="text-white/80 text-sm">{BREATHING_STEPS[breathStep].duration}s</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Step {breathStep + 1} of 4</p>
              <Button variant="outline" onClick={() => { setIsBreathing(false); setBreathStep(0); setBreathProgress(0); }}>
                Stop
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {BREATHING_STEPS.map((step, i) => (
                  <div key={i} className="text-center space-y-1">
                    <div className={`h-2 rounded-full ${step.color} opacity-60`} />
                    <p className="text-xs text-muted-foreground">{step.label}</p>
                    <p className="text-xs font-semibold text-foreground">{step.duration}s</p>
                  </div>
                ))}
              </div>
              <Button className="w-full hc-gradient-orange border-0 text-white hover:opacity-90" onClick={() => setIsBreathing(true)}>
                Start Breathing Exercise
              </Button>
            </div>
          )}
        </div>

        {/* Affirmation Gallery */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">More Affirmations</h3>
          <div className="grid grid-cols-1 gap-3">
            {AFFIRMATIONS.slice(0, 6).map((a, i) => (
              <div key={i} className="bg-white rounded-xl border p-4 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">"{a.text}"</p>
                </div>
                <Badge variant="secondary" className={`text-xs flex-shrink-0 ${CATEGORY_COLORS[a.category] || ""}`}>
                  {a.category}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-50 to-rose-50 rounded-2xl border border-violet-100 p-6 text-center space-y-3">
          <p className="font-semibold text-foreground">Ready to check in with yourself?</p>
          <p className="text-sm text-muted-foreground">Pair your mindset practice with a daily Emotional Check-In for deeper insights.</p>
          {isAuthenticated ? (
            <Button className="hc-gradient-orange border-0 text-white hover:opacity-90" onClick={() => navigate("/checkin")}>
              Start Check-In <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="hc-gradient-orange border-0 text-white hover:opacity-90" asChild>
              <a href={getLoginUrl()}>Get Started <ArrowRight className="w-4 h-4 ml-1" /></a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
