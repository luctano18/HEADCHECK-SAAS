import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Brain, Heart, Sparkles, ArrowRight, Shield, Users, BookOpen,
  TrendingUp, Flame, Award, Building2, CheckCircle2, Star, Zap
} from "lucide-react";

const EMOTIONS = [
  { label: "Overwhelmed", emoji: "😰" },
  { label: "Anxious", emoji: "😟" },
  { label: "Stressed", emoji: "😤" },
  { label: "Disconnected", emoji: "😶" },
  { label: "Tired", emoji: "😴" },
  { label: "Frustrated", emoji: "😠" },
  { label: "Heavy-hearted", emoji: "💔" },
  { label: "Calm but unsure", emoji: "😌" },
  { label: "Motivated but stuck", emoji: "🤔" },
  { label: "Hopeful", emoji: "🌟" },
];

const EI_PILLARS = [
  { icon: "🧠", title: "Self-Awareness", desc: "Recognize and understand your emotions, strengths, and values." },
  { icon: "🌊", title: "Self-Regulation", desc: "Manage your emotions and reactions in healthy, constructive ways." },
  { icon: "🔥", title: "Motivation", desc: "Find inner drive and purpose, even through setbacks." },
  { icon: "🤝", title: "Empathy", desc: "Understand and share the feelings of others with compassion." },
  { icon: "💬", title: "Social Skills", desc: "Build healthy relationships and communicate effectively." },
];

const AFRICAN_PROVERBS = [
  { proverb: "Hurry, hurry has no blessing.", origin: "Swahili" },
  { proverb: "I am because we are.", origin: "Ubuntu Philosophy" },
  { proverb: "Little by little, a little becomes a lot.", origin: "Tanzanian" },
  { proverb: "If you want to go fast, go alone. If you want to go far, go together.", origin: "African" },
];

const B2B_FEATURES = [
  "Team wellness dashboard with real-time insights",
  "Anonymous student check-ins and sentiment tracking",
  "Crisis alert system with intervention pathways",
  "AI-powered recommendations for facilitators",
  "Exportable reports for stakeholders",
  "Dedicated onboarding and support",
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [proverb] = useState(() => AFRICAN_PROVERBS[Math.floor(Math.random() * AFRICAN_PROVERBS.length)]);

  const toggleEmotion = (label: string) => {
    setSelectedEmotions(prev =>
      prev.includes(label) ? prev.filter(e => e !== label) : [...prev, label]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl hc-gradient-orange flex items-center justify-center shadow-sm">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">HeadCheck <span className="text-primary">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Check-In", path: "/check-in" },
              { label: "Learn EI", path: "/learn-ei" },
              { label: "Resources", path: "/resources" },
              { label: "Seven Mirrors", path: "/seven-mirrors" },
              { label: "Mindset", path: "/mindset" },
              { label: "For Institutions", path: "#institutions" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => item.path.startsWith("#") ? document.getElementById("institutions")?.scrollIntoView({ behavior: "smooth" }) : navigate(item.path)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} size="sm">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button asChild size="sm" className="hc-gradient-orange border-0 text-white hover:opacity-90">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hc-gradient-warm py-20 md:py-28">
        <div className="container max-w-4xl text-center space-y-6">
          <Badge variant="secondary" className="bg-white/80 text-foreground border-0 shadow-sm px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            Neuroscience × African Wisdom × Emotional Intelligence
          </Badge>

          {/* Gradient bar like headcheck.app */}
          <div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-3">
              HeadCheck <span className="text-primary">AI</span>
            </h1>
            <div className="hc-gradient-bar h-2 rounded-full max-w-md mx-auto mb-6" />
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your supportive space for emotional clarity. Transform stress into insight with AI-powered guidance rooted in African wisdom.
            </p>
          </div>

          {/* 3 pillars like headcheck.app */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
            {[
              { icon: <Brain className="w-5 h-5" />, label: "Ground Yourself", color: "bg-violet-100 text-violet-600" },
              { icon: <Heart className="w-5 h-5" />, label: "Name Your Feelings", color: "bg-rose-100 text-rose-600" },
              { icon: <Sparkles className="w-5 h-5" />, label: "Find Direction", color: "bg-amber-100 text-amber-600" },
            ].map((p) => (
              <div key={p.label} className="bg-white/80 rounded-2xl p-4 shadow-sm text-center space-y-2">
                <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center mx-auto`}>{p.icon}</div>
                <p className="text-xs font-semibold text-foreground">{p.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {isAuthenticated ? (
              <Button size="lg" className="h-14 px-8 text-base rounded-full hc-gradient-orange border-0 text-white hover:opacity-90 shadow-lg" onClick={() => navigate("/check-in")}>
                <Heart className="w-5 h-5 mr-2" /> Start Your Check-In
              </Button>
            ) : (
              <Button size="lg" className="h-14 px-8 text-base rounded-full hc-gradient-orange border-0 text-white hover:opacity-90 shadow-lg" asChild>
                <a href={getLoginUrl()}>Start Your Check-In <ArrowRight className="w-5 h-5 ml-2" /></a>
              </Button>
            )}
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full bg-white/80 hover:bg-white" onClick={() => navigate("/seven-mirrors")}>
              <Sparkles className="w-5 h-5 mr-2" /> Seven Mirrors
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> Build your streak</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" /> Unlock achievements</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> Private & secure</span>
          </div>
        </div>
      </section>

      {/* ── Interactive Check-In Preview ── */}
      <section className="py-16 bg-background">
        <div className="container max-w-2xl">
          <div className="bg-white rounded-3xl shadow-xl border p-8 space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl hc-gradient-orange flex items-center justify-center mx-auto mb-3 shadow-md">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Take a moment to pause and reflect</h2>
              <p className="text-muted-foreground mt-1">How are you feeling right now?</p>
              <p className="text-xs text-muted-foreground">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EMOTIONS.map((e) => (
                <button
                  key={e.label}
                  onClick={() => toggleEmotion(e.label)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    selectedEmotions.includes(e.label)
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-border bg-muted/20 text-foreground hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
                >
                  <span className="text-lg">{e.emoji}</span>
                  {e.label}
                </button>
              ))}
            </div>
            <Button
              className="w-full h-12 rounded-xl text-base hc-gradient-orange border-0 text-white hover:opacity-90"
              disabled={selectedEmotions.length === 0}
              onClick={() => isAuthenticated ? navigate("/check-in") : window.location.href = getLoginUrl()}
            >
              {selectedEmotions.length > 0 ? `Continue with ${selectedEmotions.length} feeling${selectedEmotions.length > 1 ? "s" : ""}` : "Select how you feel"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Daily African Proverb ── */}
      <section className="py-12 hc-gradient-warm">
        <div className="container max-w-2xl text-center">
          <p className="text-3xl font-serif font-bold text-foreground mb-2">"{proverb.proverb}"</p>
          <p className="text-sm text-muted-foreground">— {proverb.origin} proverb</p>
        </div>
      </section>

      {/* ── 5 EI Pillars ── */}
      <section className="py-16 bg-background">
        <div className="container max-w-4xl space-y-10">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">Learn EI</Badge>
            <h2 className="font-serif text-3xl font-bold text-foreground">The 5 Pillars of Emotional Intelligence</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Understanding these pillars is the foundation of emotional wellness and growth. Each pillar is paired with African wisdom to guide your journey.</p>
          </div>
          <div className="space-y-3">
            {EI_PILLARS.map((p, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl flex-shrink-0">{p.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button variant="outline" onClick={() => navigate("/learn-ei")}>
              <BookOpen className="w-4 h-4 mr-2" /> Explore All EI Pillars
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-5xl space-y-10">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground">Everything you need for emotional wellness</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: <Heart className="w-6 h-6" />, color: "bg-rose-100 text-rose-600", title: "Emotional Check-In", desc: "Daily multi-emotion check-ins with intensity tracking, context, and personal journaling." },
              { icon: <Sparkles className="w-6 h-6" />, color: "bg-violet-100 text-violet-600", title: "Seven Mirrors", desc: "A 7-step deep reflection journey across Values, Loyalty, Growth, Peace and more." },
              { icon: <Brain className="w-6 h-6" />, color: "bg-amber-100 text-amber-600", title: "AI Response Engine", desc: "6-part AI responses: Brain Insight, EI Pillar, African Proverb, Next Steps, and more." },
              { icon: <Shield className="w-6 h-6" />, color: "bg-red-100 text-red-600", title: "Crisis Detection", desc: "Real-time automatic detection with 988 Lifeline integration and intervention pathways." },
              { icon: <Flame className="w-6 h-6" />, color: "bg-orange-100 text-orange-600", title: "Streaks & Achievements", desc: "Build daily check-in streaks and unlock achievement badges to stay motivated." },
              { icon: <BookOpen className="w-6 h-6" />, color: "bg-green-100 text-green-600", title: "Resources Library", desc: "Curated articles, videos, books, and exercises on neuroscience and African wisdom." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border shadow-sm space-y-3">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center`}>{f.icon}</div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Institutions ── */}
      <section id="institutions" className="py-16 bg-background">
        <div className="container max-w-5xl">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 md:p-14 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <Building2 className="w-3.5 h-3.5 mr-1.5" /> For Schools & Organizations
                </Badge>
                <h2 className="font-serif text-3xl font-bold">HeadCheck AI for Institutions</h2>
                <p className="text-white/70 leading-relaxed">
                  Empower your students and teams with emotional intelligence tools. Get anonymized wellness insights, crisis alerts, and engagement analytics — all in one dedicated dashboard.
                </p>
                <div className="space-y-2">
                  {B2B_FEATURES.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  {isAuthenticated ? (
                    <Button className="bg-white text-slate-900 hover:bg-white/90" onClick={() => navigate("/facilitator")}>
                      <Users className="w-4 h-4 mr-2" /> Open Facilitator Dashboard
                    </Button>
                  ) : (
                    <Button className="bg-white text-slate-900 hover:bg-white/90" asChild>
                      <a href={getLoginUrl()}>Get Started for Free <ArrowRight className="w-4 h-4 ml-2" /></a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: <TrendingUp className="w-5 h-5 text-violet-400" />, title: "Cohort Analytics", desc: "Track emotional trends across your entire student body, anonymously." },
                  { icon: <Shield className="w-5 h-5 text-red-400" />, title: "Crisis Alerts", desc: "Receive instant alerts when students show signs of distress." },
                  { icon: <Users className="w-5 h-5 text-blue-400" />, title: "Group Management", desc: "Create cohorts, invite students, and monitor engagement by group." },
                ].map((item) => (
                  <div key={item.title} className="bg-white/10 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="font-semibold text-white text-sm">{item.title}</p>
                      <p className="text-xs text-white/60 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 hc-gradient-warm">
        <div className="container max-w-2xl text-center space-y-6">
          <div className="text-5xl">🌍</div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Your emotional wellness journey starts today</h2>
          <p className="text-muted-foreground">Join thousands of individuals and institutions building emotional intelligence through African wisdom and neuroscience.</p>
          {isAuthenticated ? (
            <Button size="lg" className="h-14 px-10 text-base rounded-full hc-gradient-orange border-0 text-white hover:opacity-90 shadow-lg" onClick={() => navigate("/check-in")}>
              <Heart className="w-5 h-5 mr-2" /> Start Your Check-In
            </Button>
          ) : (
            <Button size="lg" className="h-14 px-10 text-base rounded-full hc-gradient-orange border-0 text-white hover:opacity-90 shadow-lg" asChild>
              <a href={getLoginUrl()}>Get Started — It's Free <ArrowRight className="w-5 h-5 ml-2" /></a>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">No credit card required. Private & secure. HIPAA-ready.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-white py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg hc-gradient-orange flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground">HeadCheck AI</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This tool is a reflective support companion. It is not a replacement for professional mental health services. If you are in crisis, please contact the <strong>988 Suicide & Crisis Lifeline</strong>.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/learn-ei")} className="hover:text-foreground transition-colors">Learn EI</button>
            <button onClick={() => navigate("/resources")} className="hover:text-foreground transition-colors">Resources</button>
            <button onClick={() => navigate("/mindset")} className="hover:text-foreground transition-colors">Mindset</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
