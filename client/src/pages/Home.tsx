import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Brain, Heart, Shield, Sparkles, Users, BookOpen, ArrowRight, CheckCircle2, Star } from "lucide-react";

const EMOTIONS = ["😌 Calm", "😔 Sad", "😤 Frustrated", "😰 Anxious", "😊 Hopeful", "😤 Angry", "😴 Exhausted", "🌟 Grateful"];

const FEATURES = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Emotional Check-In",
    description: "A guided daily check-in that captures your emotion, intensity, context, and personal journal — all in under 2 minutes.",
    color: "from-pink-100 to-rose-50",
    iconBg: "bg-rose-100 text-rose-600",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Insights",
    description: "Receive a 6-part structured response: emotional reflection, brain science, EI pillar guidance, African proverb, next steps, and support.",
    color: "from-violet-100 to-purple-50",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Seven Mirrors",
    description: "A deep introspective journey through 7 thematic mirrors — Values, Loyalty, Inner Conflict, Self-Appreciation, Red Flags, Growth, and Peace.",
    color: "from-amber-100 to-yellow-50",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Crisis Detection",
    description: "Real-time AI analysis of your journal entries detects distress signals and immediately connects you to the 988 Suicide & Crisis Lifeline.",
    color: "from-green-100 to-emerald-50",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Institutional Dashboard",
    description: "Schools and mental health centers get anonymized cohort analytics, high-risk alerts, and engagement tracking — without compromising privacy.",
    color: "from-blue-100 to-sky-50",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "AIEI — African Wisdom",
    description: "Grounded in African-Inspired Emotional Intelligence, each response includes a culturally resonant proverb to foster resilience and reflection.",
    color: "from-orange-100 to-amber-50",
    iconBg: "bg-orange-100 text-orange-600",
  },
];

const TESTIMONIALS = [
  { name: "Ms. Johnson", role: "School Counselor", text: "HeadCheck AI has transformed how we support our students. The anonymized dashboard lets us spot trends before they become crises.", stars: 5 },
  { name: "Marcus T.", role: "University Student", text: "The Seven Mirrors module helped me understand patterns in my emotions I never noticed before. The African proverbs hit different.", stars: 5 },
  { name: "Dr. Amara", role: "Mental Health Professional", text: "The neuroscience-backed insights are accurate and accessible. My clients find it incredibly validating to understand their brain's role.", stars: 5 },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">HeadCheck <span className="text-primary">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Stories</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} size="sm">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = getLoginUrl() }>Sign In</Button>
                <Button size="sm" onClick={handleGetStarted}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 hc-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Neuroscience × African Wisdom × Emotional Intelligence
            </Badge>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6">
              Your emotional
              <span className="block text-primary italic">wellness companion</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              HeadCheck AI combines cutting-edge neuroscience with African-Inspired Emotional Intelligence to provide personalized, culturally grounded mental wellness support — for individuals and institutions alike.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-base px-8 h-12 shadow-lg shadow-primary/25">
                Start Your Check-In <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12">
                See How It Works
              </Button>
            </div>
          </div>

          {/* Floating emotion pills */}
          <div className="mt-16 flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {EMOTIONS.map((e) => (
              <span key={e} className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium shadow-sm border border-white/50 hover:bg-white/90 transition-colors cursor-default">
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">Everything you need to thrive</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">A complete emotional wellness ecosystem built for depth, privacy, and cultural resonance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className={`rounded-2xl p-6 bg-gradient-to-br ${f.color} border border-white/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">How HeadCheck AI works</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">A thoughtful, structured process designed to meet you exactly where you are.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Check In", desc: "Select your emotion, rate its intensity (1–10), choose your context, and optionally write in your journal." },
              { step: "02", title: "AI Analysis", desc: "Our engine analyzes your input in real-time, detecting patterns and any crisis signals that need immediate attention." },
              { step: "03", title: "Receive Insights", desc: "Get a 6-part personalized response: brain science, EI guidance, an African proverb, and your next step." },
              { step: "04", title: "Track & Grow", desc: "Review your emotional trends over time and dive deeper with the Seven Mirrors reflection journey." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-primary/25">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">Voices of transformation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 hc-gradient-dark text-white">
        <div className="container text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Your emotional health matters.
            <span className="block italic font-normal text-white/80 mt-2">Start today.</span>
          </h2>
          <p className="text-lg text-white/70 max-w-xl mx-auto mb-10">
            Join thousands of individuals and institutions using HeadCheck AI to build emotional resilience, one check-in at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="bg-white text-primary hover:bg-white/90 text-base px-8 h-12 font-semibold">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/60">
            {["No credit card required", "Privacy-first design", "HIPAA/FERPA ready"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white/40" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 bg-muted/30 border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">HeadCheck AI</span>
          </div>
          <p>© {new Date().getFullYear()} HeadCheck AI. All rights reserved.</p>
          <p className="text-xs text-center md:text-right max-w-xs">
            HeadCheck AI is an emotional support tool, not a substitute for professional clinical therapy.
            In crisis? Call <span className="font-semibold text-foreground">988</span>.
          </p>
        </div>
      </footer>
    </div>
  );
}
