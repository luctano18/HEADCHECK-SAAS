import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Brain, Heart, Compass, Sparkles, ArrowRight, Flame, Trophy, BookOpen, Shield } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleCheckIn = () => navigate("/checkin");
  const handleCompass = () => navigate("/compass");

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.03_285)] font-sans">

      <NavBar />

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[oklch(0.88_0.06_285)] text-[oklch(0.45_0.18_285)] text-sm font-medium mb-8 shadow-sm">
          <Heart className="w-4 h-4 fill-[oklch(0.45_0.18_285)]" />
          A Real Time Emotional Response System
        </div>

        <h1 className="text-6xl md:text-7xl font-black text-[oklch(0.18_0.04_260)] mb-2 tracking-tight">
          HeadCheck
        </h1>
        <p className="text-lg font-semibold text-[oklch(0.45_0.18_285)] mb-4 tracking-wide uppercase">
          Know your mind. Lead your life.
        </p>

        {/* Gradient bar — signature headcheck.app element */}
        <div className="w-full max-w-2xl mx-auto h-3 rounded-full mb-6"
          style={{ background: "linear-gradient(to right, oklch(0.55 0.22 285), oklch(0.65 0.20 340), oklch(0.72 0.18 48), oklch(0.75 0.16 120))" }} />

        <p className="text-xl text-[oklch(0.45_0.04_260)] max-w-xl mx-auto mb-10 leading-relaxed">
          HeadCheck helps you understand your feelings, reflect with honesty, and take your next step with clarity.
        </p>

        <Button
          onClick={handleCheckIn}
          size="lg"
          className="rounded-full px-10 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
        >
          Start Your Check-In
        </Button>

        <div className="flex items-center justify-center gap-6 mt-5 text-sm text-[oklch(0.55_0.04_260)]">
          <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> Build your streak</span>
          <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> Unlock achievements</span>
        </div>
      </section>

      {/* ── 3 FEATURE CARDS ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: "🧠", color: "oklch(0.88 0.08 285)", label: "Ground Yourself", desc: "Reduce emotional escalation and regain focus" },
            { icon: "❤️", color: "oklch(0.88 0.08 10)", label: "Name Your Feelings", desc: "Understand what you're experiencing and why it matters" },
            { icon: "✨", color: "oklch(0.88 0.08 155)", label: "Find Direction", desc: "Identify next steps and connect with support" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-[oklch(0.92_0.03_260)] text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ background: card.color }}>
                {card.icon}
              </div>
              <h3 className="font-bold text-[oklch(0.18_0.04_260)] mb-2">{card.label}</h3>
              <p className="text-sm text-[oklch(0.55_0.04_260)] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT IS HEADCHECK ── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[oklch(0.92_0.03_260)]">
          <h2 className="text-2xl font-bold text-[oklch(0.18_0.04_260)] mb-4">What is HeadCheck?</h2>
          <p className="text-[oklch(0.35_0.04_260)] leading-relaxed mb-5">
            HeadCheck is a <span className="font-semibold text-[oklch(0.45_0.18_285)]">mental wellness tool</span> designed to help you pause, reflect, and process what you're experiencing. Whether you're feeling overwhelmed, stuck, or just need a moment to check in with yourself, HeadCheck guides you through a structured reflection process.
          </p>
          <h3 className="font-semibold text-[oklch(0.18_0.04_260)] mb-3">How it works:</h3>
          <ol className="space-y-2.5">
            {[
              { step: "1", title: "Start a check-in", desc: "Answer a few simple questions about how you're feeling right now" },
              { step: "2", title: "Name your emotions", desc: "Identify and understand what you're experiencing" },
              { step: "3", title: "Find clarity", desc: "Discover patterns, get personalized insights, and identify next steps" },
              { step: "4", title: "Build momentum", desc: "Track your progress, build streaks, and unlock achievements" },
            ].map((item) => (
              <li key={item.step} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}>
                  {item.step}
                </span>
                <span className="text-[oklch(0.35_0.04_260)]">
                  <strong className="text-[oklch(0.18_0.04_260)]">{item.title}</strong> – {item.desc}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 p-4 rounded-xl bg-[oklch(0.96_0.03_285)]">
            <h3 className="font-semibold text-[oklch(0.18_0.04_260)] mb-2">Who is this for?</h3>
            <p className="text-sm text-[oklch(0.45_0.04_260)] leading-relaxed">
              HeadCheck is for anyone who wants to develop greater self-awareness and emotional clarity. Students managing academic stress, professionals navigating workplace challenges, or anyone seeking a structured way to process their feelings and maintain mental wellness.
            </p>
            <p className="text-sm text-[oklch(0.45_0.04_260)] leading-relaxed mt-3">
              Think of HeadCheck as your <span className="font-semibold text-[oklch(0.45_0.18_285)]">personal reflection companion</span> – a safe, private space where you can be honest about how you're feeling and get the clarity you need to move forward.
            </p>
          </div>
        </div>
      </section>

      {/* ── SELF TRUST COMPASS SECTION ── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[oklch(0.92_0.03_260)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}>
              🧭
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[oklch(0.18_0.04_260)]">The Self Trust Compass</h2>
              <p className="text-sm text-[oklch(0.55_0.04_260)]">A deeper reflection practice for building self-awareness and trust in your own judgment</p>
            </div>
          </div>

          <p className="text-[oklch(0.35_0.04_260)] leading-relaxed mb-5">
            The Self Trust Compass is an extended reflection journey that explores seven key aspects of your relationship with yourself. Unlike the quick check-ins, which help you process immediate feelings, the Compass is designed for times when you want to go deeper and explore patterns in how you relate to yourself.
          </p>

          <h3 className="font-semibold text-[oklch(0.18_0.04_260)] mb-3">The Seven Mirrors:</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { n: 1, name: "Self-Awareness", q: "How well do you know yourself?" },
              { n: 2, name: "Self-Compassion", q: "How kind are you to yourself?" },
              { n: 3, name: "Boundaries", q: "Can you honor your needs?" },
              { n: 4, name: "Authenticity", q: "Are you true to yourself?" },
              { n: 5, name: "Decision-Making", q: "Do you trust your choices?" },
              { n: 6, name: "Resilience", q: "How do you handle setbacks?" },
              { n: 7, name: "Growth Mindset", q: "How do you view your potential?" },
            ].map((m) => (
              <div key={m.n} className="flex gap-2.5 items-start p-3 rounded-xl bg-[oklch(0.96_0.03_285)]">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}>
                  {m.n}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[oklch(0.18_0.04_260)]">{m.name}</p>
                  <p className="text-xs text-[oklch(0.55_0.04_260)]">{m.q}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3 mb-6 text-sm text-[oklch(0.45_0.04_260)]">
            <div className="p-3 rounded-xl bg-[oklch(0.94_0.04_285)] text-center">
              <p className="font-semibold text-[oklch(0.45_0.18_285)]">Check-Ins</p>
              <p>Day-to-day emotions (5 min)</p>
            </div>
            <div className="p-3 rounded-xl bg-[oklch(0.94_0.06_48)] text-center">
              <p className="font-semibold text-[oklch(0.55_0.18_48)]">Compass</p>
              <p>Deeper patterns (10-15 min)</p>
            </div>
            <div className="p-3 rounded-xl bg-[oklch(0.94_0.05_155)] text-center">
              <p className="font-semibold text-[oklch(0.45_0.12_155)]">Together</p>
              <p>Complete wellness practice</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleCompass} className="flex-1 rounded-full font-semibold"
              style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}>
              Begin Your Compass Journey
            </Button>
            {isAuthenticated && (
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="flex-1 rounded-full font-semibold">
                View Analytics Dashboard
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── EI QUIZ SECTION ── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-3xl p-8 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #D97706 100%)" }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                🧠
              </div>
              <div>
                <h2 className="text-2xl font-bold">EI Quiz</h2>
                <p className="text-white/70 text-sm">Emotional Intelligence Assessment · 25 questions · ~8 min</p>
              </div>
            </div>
            <p className="text-white/80 mb-5 leading-relaxed">
              Discover your EI profile across 5 pillars: Self-Awareness, Self-Regulation, Motivation, Empathy, and Social Skills. Get a personalized radar chart and a personalized AI insight.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="font-bold text-lg">🎯</div>
                <div className="text-white/70 text-xs mt-1">5 Pillar Scores</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="font-bold text-lg">📊</div>
                <div className="text-white/70 text-xs mt-1">Radar Chart</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="font-bold text-lg">✨</div>
                <div className="text-white/70 text-xs mt-1">AI Insight</div>
              </div>
            </div>
            <Button
              onClick={() => navigate("/ei-quiz")}
              className="rounded-full font-semibold bg-white text-violet-700 hover:bg-white/90 px-8"
            >
              Take the EI Quiz <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOR INSTITUTIONS ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-3xl p-8 text-white"
          style={{ background: "linear-gradient(135deg, oklch(0.22 0.08 285), oklch(0.35 0.14 285))" }}>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[oklch(0.80_0.14_48)]" />
            <h2 className="text-2xl font-bold">For Institutions</h2>
          </div>
          <p className="text-[oklch(0.80_0.04_260)] mb-6 max-w-2xl leading-relaxed">
            Bring HeadCheck AI to your school, university, or mental health center. Our institutional platform provides anonymized cohort analytics, facilitator dashboards, and secure student group management.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { icon: "📊", title: "Cohort Analytics", desc: "Anonymized emotional trend data across student groups" },
              { icon: "🔔", title: "Crisis Alerts", desc: "Real-time notifications for high-risk student profiles" },
              { icon: "🔒", title: "Data Isolation", desc: "Complete privacy separation between institutions" },
            ].map((f) => (
              <div key={f.title} className="bg-white/10 rounded-2xl p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-[oklch(0.80_0.04_260)]">{f.desc}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => navigate("/for-institutions")} variant="outline"
            className="rounded-full font-semibold border-white/40 text-white hover:bg-white/10 bg-transparent">
            Learn More <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
