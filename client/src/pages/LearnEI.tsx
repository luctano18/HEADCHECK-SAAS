import { useState } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { EI_PILLARS } from "@shared/headcheckData";
import { BookOpen, ChevronDown, ChevronUp, Sparkles, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const EI_BENEFITS = [
  { emoji: "🧠", title: "Better Decision-Making", desc: "People with high EI make more thoughtful choices under pressure." },
  { emoji: "🤝", title: "Stronger Relationships", desc: "EI improves empathy, communication, and trust in all relationships." },
  { emoji: "💼", title: "Career Advancement", desc: "90% of top performers have high emotional intelligence." },
  { emoji: "🧘", title: "Stress Resilience", desc: "EI equips you to regulate emotions and bounce back from adversity." },
  { emoji: "🌱", title: "Personal Growth", desc: "Self-awareness is the foundation of all meaningful change." },
  { emoji: "🎯", title: "Goal Achievement", desc: "Motivation — an EI pillar — drives persistence toward long-term goals." },
  { emoji: "💬", title: "Conflict Resolution", desc: "EI helps you navigate difficult conversations with grace." },
  { emoji: "❤️", title: "Mental Wellbeing", desc: "Emotional literacy reduces anxiety, depression, and burnout." },
];

export default function LearnEI() {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.98 0.01 260)" }}>
      <NavBar />

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4" style={{ background: "oklch(0.95 0.04 285)", color: "oklch(0.45 0.18 285)" }}>
            <BookOpen className="w-4 h-4" /> Learn Emotional Intelligence
          </div>
          <h1 className="text-4xl font-black mb-4" style={{ color: "oklch(0.18 0.04 260)" }}>
            The Five Pillars of EI
          </h1>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "oklch(0.45 0.04 260)" }}>
            Emotional Intelligence (EI) is the ability to understand, use, and manage your emotions in positive ways. Developed by Daniel Goleman, EI is built on five core pillars — each enriched with African wisdom (AIEI).
          </p>
        </div>

        {/* How HeadCheck Builds EI */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border mb-10" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: "oklch(0.18 0.04 260)" }}>How HeadCheck Builds Your EI</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "✅", label: "Check In", desc: "Name your emotions daily" },
              { icon: "🌿", label: "Ground Yourself", desc: "Regulate with breathing & body scan" },
              { icon: "✨", label: "Get Guidance", desc: "AI + African wisdom response" },
              { icon: "🌱", label: "Grow", desc: "Track patterns & build resilience" },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 rounded-2xl" style={{ background: "oklch(0.96 0.03 285)" }}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="font-bold text-sm mb-1" style={{ color: "oklch(0.25 0.04 260)" }}>{item.label}</p>
                <p className="text-xs" style={{ color: "oklch(0.55 0.04 260)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Five Pillars Accordion */}
        <div className="space-y-3 mb-12">
          {EI_PILLARS.map((pillar, i) => (
            <div
              key={pillar.id}
              className="bg-white rounded-2xl border overflow-hidden shadow-sm"
              style={{ borderColor: expanded === i ? "oklch(0.75 0.12 285)" : "oklch(0.92 0.03 260)" }}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pillar.emoji}</span>
                  <div>
                    <p className="font-bold" style={{ color: "oklch(0.18 0.04 260)" }}>
                      Pillar {i + 1}: {pillar.name}
                    </p>
                    <p className="text-sm" style={{ color: "oklch(0.55 0.04 260)" }}>{pillar.description.slice(0, 60)}...</p>
                  </div>
                </div>
                {expanded === i
                  ? <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: "oklch(0.45 0.18 285)" }} />
                  : <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: "oklch(0.65 0.03 260)" }} />
                }
              </button>

              {expanded === i && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: "oklch(0.94 0.02 260)" }}>
                  <p className="text-sm leading-relaxed mt-4 mb-4" style={{ color: "oklch(0.40 0.04 260)" }}>
                    {pillar.description}
                  </p>

                  {/* Brain insight */}
                  {(pillar as any).brainNote && (
                    <div className="mb-4 p-4 rounded-2xl" style={{ background: "oklch(0.95 0.04 285)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.45 0.18 285)" }}>🧬 Brain Insight</p>
                      <p className="text-sm" style={{ color: "oklch(0.35 0.08 285)" }}>{(pillar as any).brainNote}</p>
                    </div>
                  )}

                  {/* Key practices */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "oklch(0.55 0.04 260)" }}>Key Practices</p>
                    <div className="flex flex-wrap gap-2">
                      {pillar.practices.map((practice: string) => (
                        <span key={practice} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "oklch(0.95 0.04 285)", color: "oklch(0.40 0.12 285)" }}>
                          {practice}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* African proverb */}
                  <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, oklch(0.96 0.04 48), oklch(0.97 0.03 340))" }}>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.55 0.18 48)" }} />
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.55 0.10 48)" }}>🌍 African Wisdom (AIEI)</p>
                        <p className="text-sm font-semibold italic mb-1" style={{ color: "oklch(0.30 0.08 48)" }}>
                          "{pillar.proverb.text}"
                        </p>
                        <p className="text-xs" style={{ color: "oklch(0.55 0.06 48)" }}>— {pillar.proverb.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Benefits of EI */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: "oklch(0.18 0.04 260)" }}>
            Benefits of High Emotional Intelligence
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EI_BENEFITS.map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-2xl p-4 shadow-sm border text-center" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
                <div className="text-2xl mb-2">{benefit.emoji}</div>
                <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.25 0.04 260)" }}>{benefit.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "oklch(0.55 0.04 260)" }}>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* EI Quiz CTA */}
        <div className="mb-8 bg-white rounded-3xl p-8 shadow-sm border" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 text-center">
              <div className="text-6xl mb-2">🧠</div>
              <div className="text-xs font-medium" style={{ color: "oklch(0.55 0.04 260)" }}>~8 minutes</div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.18 0.04 260)" }}>Discover Your EI Profile</h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "oklch(0.45 0.04 260)" }}>
                Take our 25-question interactive quiz to measure your emotional intelligence across all 5 pillars. Get a personalized radar chart, pillar scores, and a personalized AI insight.
              </p>
              <button
                onClick={() => navigate("/ei-quiz")}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #7C3AED, #D97706)" }}
              >
                <Sparkles className="w-4 h-4" /> Take the EI Quiz
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-3xl text-white" style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}>
          <h2 className="text-2xl font-bold mb-3">Ready to build your EI?</h2>
          <p className="mb-6 opacity-80">Start with a daily Check-In and track your emotional growth over time.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/checkin")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm"
              style={{ background: "white", color: "oklch(0.45 0.18 285)" }}
            >
              <Sparkles className="w-4 h-4" /> Start Your Check-In
            </button>
            <button
              onClick={() => navigate("/compass")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border-2 border-white/40 text-white hover:bg-white/10 transition-colors"
            >
              Explore Seven Mirrors <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
