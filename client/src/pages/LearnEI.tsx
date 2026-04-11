import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

const PILLARS = [
  {
    emoji: "🧠",
    title: "Self-Awareness",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    accent: "bg-violet-500",
    description: "The ability to recognize and understand your emotions, strengths, weaknesses, values, and how they impact others. It's the foundation of emotional intelligence — knowing yourself deeply and honestly.",
    practices: [
      "Keep a daily emotion journal to track patterns",
      "Pause before reacting and ask: 'What am I feeling right now?'",
      "Seek honest feedback from trusted people in your life",
      "Reflect on your values and whether your actions align with them",
    ],
    proverb: "Know yourself and you will win all battles.",
    proverbOrigin: "Sun Tzu (adapted in African oral tradition)",
    brainNote: "The prefrontal cortex helps you observe your own thoughts and emotions. Strengthening self-awareness literally builds new neural pathways in this region.",
  },
  {
    emoji: "🌊",
    title: "Self-Regulation",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    accent: "bg-blue-500",
    description: "The ability to manage your emotions, impulses, and reactions in healthy ways. It means pausing before responding, staying flexible under pressure, and choosing your response rather than being controlled by your feelings.",
    practices: [
      "Practice the 'pause and breathe' technique before responding",
      "Use box breathing (4-4-4-4) to calm your nervous system",
      "Identify your emotional triggers and create a response plan",
      "Reframe challenges as opportunities for growth",
    ],
    proverb: "Hurry, hurry has no blessing.",
    proverbOrigin: "Swahili proverb",
    brainNote: "When you regulate emotions, you're activating your prefrontal cortex to override the amygdala's reactive signals — a skill that grows stronger with practice.",
  },
  {
    emoji: "🔥",
    title: "Motivation",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    accent: "bg-amber-500",
    description: "The inner drive to pursue goals with energy and persistence, especially during setbacks. It's about finding meaning and purpose in your work and life, and staying committed to what matters most to you.",
    practices: [
      "Connect daily tasks to your deeper 'why' and purpose",
      "Celebrate small wins to build momentum",
      "Visualize your goals and the person you're becoming",
      "Surround yourself with people who inspire and challenge you",
    ],
    proverb: "Little by little, a little becomes a lot.",
    proverbOrigin: "Tanzanian proverb",
    brainNote: "Motivation is linked to dopamine pathways. Setting and achieving small goals releases dopamine, creating a positive feedback loop that fuels continued effort.",
  },
  {
    emoji: "🤝",
    title: "Empathy",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    accent: "bg-rose-500",
    description: "The capacity to understand and share the feelings of others. It goes beyond sympathy — it's about truly stepping into another person's experience, validating their emotions, and responding with compassion.",
    practices: [
      "Listen actively without interrupting or planning your response",
      "Ask 'How are you really feeling?' and genuinely wait for the answer",
      "Validate others' emotions even when you disagree with their perspective",
      "Practice perspective-taking by imagining life in someone else's shoes",
    ],
    proverb: "I am because we are.",
    proverbOrigin: "Ubuntu Philosophy",
    brainNote: "Mirror neurons in your brain fire when you observe others' emotions, creating a neurological basis for empathy. You can strengthen this by actively practicing compassionate listening.",
  },
  {
    emoji: "💬",
    title: "Social Skills & Communication",
    color: "bg-green-100 text-green-700 border-green-200",
    accent: "bg-green-500",
    description: "The ability to build healthy relationships, communicate clearly, set boundaries, and navigate social dynamics effectively. It includes managing conflict constructively and working collaboratively with others.",
    practices: [
      "Use 'I' statements to express feelings without blame",
      "Practice setting clear, kind boundaries in your relationships",
      "Learn to manage conflict by focusing on issues, not personalities",
      "Build your network intentionally — quality over quantity",
    ],
    proverb: "If you want to go fast, go alone. If you want to go far, go together.",
    proverbOrigin: "African proverb",
    brainNote: "Social connection activates the brain's reward system and reduces cortisol levels. Healthy relationships are literally protective for your brain and mental health.",
  },
];

export default function LearnEI() {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Top gradient bar */}
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
          <Button size="sm" onClick={() => navigate("/check-in")} className="hc-gradient-orange border-0 text-white hover:opacity-90">
            Start Check-In <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="hc-gradient-warm py-14">
        <div className="container max-w-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl hc-gradient-orange flex items-center justify-center mx-auto shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground">The 5 Pillars of Emotional Intelligence</h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Understanding these pillars is the foundation of emotional wellness and growth. Each pillar is paired with African wisdom and neuroscience insights to guide your journey.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate("/check-in")} className="text-muted-foreground">
            ← Back to Check-In
          </Button>
        </div>
      </div>

      {/* Pillars */}
      <div className="container max-w-3xl py-10 space-y-4">
        {PILLARS.map((pillar, i) => (
          <div key={i} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${expanded === i ? "border-orange-200" : "border-border"}`}>
            <button
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="text-3xl flex-shrink-0">{pillar.emoji}</div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">{pillar.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{pillar.description}</p>
              </div>
              {expanded === i ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
            </button>

            {expanded === i && (
              <div className="px-5 pb-6 space-y-5 border-t">
                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed pt-4">{pillar.description}</p>

                {/* Brain note */}
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                  <p className="text-xs font-semibold text-violet-700 mb-1">🧬 Brain Insight</p>
                  <p className="text-sm text-violet-800">{pillar.brainNote}</p>
                </div>

                {/* Practices */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Practices to Develop This Pillar</p>
                  <div className="space-y-2">
                    {pillar.practices.map((p, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <div className={`w-5 h-5 rounded-full ${pillar.accent} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <span className="text-white text-xs font-bold">{j + 1}</span>
                        </div>
                        <p className="text-sm text-foreground">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* African Proverb */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-1.5">🌍 African Wisdom (AIEI)</p>
                  <p className="text-base font-serif font-bold text-amber-900 italic">"{pillar.proverb}"</p>
                  <p className="text-xs text-amber-600 mt-1">— {pillar.proverbOrigin}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="container max-w-3xl pb-16 text-center space-y-4">
        <div className="bg-white rounded-2xl border p-8 shadow-sm space-y-4">
          <p className="font-serif text-xl font-bold text-foreground">Ready to apply these pillars?</p>
          <p className="text-sm text-muted-foreground">Start a Check-In to receive personalized EI insights, or explore the Seven Mirrors for a deeper reflection journey.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="hc-gradient-orange border-0 text-white hover:opacity-90" onClick={() => navigate("/check-in")}>
              Start Emotional Check-In <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/seven-mirrors")}>
              Explore Seven Mirrors
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
