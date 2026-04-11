import { useState } from "react";
import { useLocation } from "wouter";
import { Heart, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const PILLARS = [
  {
    id: 1,
    name: "Self-Awareness",
    icon: "🪞",
    color: "from-violet-50 to-purple-50",
    accent: "oklch(0.45 0.18 285)",
    desc: "Understanding yourself through timeless wisdom.",
    proverbs: [
      { text: "Know yourself and you will win all battles.", origin: "Sun Tzu / African Adaptation" },
      { text: "The one who tells the stories rules the world.", origin: "Hopi Proverb" },
      { text: "Until the lion learns to write, every story will glorify the hunter.", origin: "African Proverb" },
    ],
  },
  {
    id: 2,
    name: "Self-Regulation",
    icon: "🌊",
    color: "from-blue-50 to-sky-50",
    accent: "oklch(0.45 0.18 220)",
    desc: "Learning balance and control through ancestral insight.",
    proverbs: [
      { text: "Hurry, hurry has no blessing.", origin: "Swahili Proverb" },
      { text: "The forest would be silent if no bird sang except those who sang best.", origin: "African Proverb" },
      { text: "He who is not courageous enough to take risks will accomplish nothing in life.", origin: "Muhammad Ali" },
    ],
  },
  {
    id: 3,
    name: "Motivation",
    icon: "🔥",
    color: "from-orange-50 to-amber-50",
    accent: "oklch(0.55 0.18 48)",
    desc: "Drawing inner strength from cultural resilience.",
    proverbs: [
      { text: "Little by little, a little becomes a lot.", origin: "Tanzanian Proverb" },
      { text: "However long the night, the dawn will break.", origin: "African Proverb" },
      { text: "A child who is not embraced by the village will burn it down to feel its warmth.", origin: "African Proverb" },
    ],
  },
  {
    id: 4,
    name: "Empathy",
    icon: "❤️",
    color: "from-pink-50 to-rose-50",
    accent: "oklch(0.55 0.18 10)",
    desc: "Walking in others' shoes with a global heart.",
    proverbs: [
      { text: "I am because we are.", origin: "Ubuntu Philosophy" },
      { text: "If you want to go fast, go alone. If you want to go far, go together.", origin: "African Proverb" },
      { text: "The axe forgets, but the tree remembers.", origin: "African Proverb" },
    ],
  },
  {
    id: 5,
    name: "Social Skills",
    icon: "🤝",
    color: "from-green-50 to-emerald-50",
    accent: "oklch(0.45 0.12 155)",
    desc: "Building meaningful connections rooted in Ubuntu.",
    proverbs: [
      { text: "A single hand cannot tie a bundle.", origin: "African Proverb" },
      { text: "When spider webs unite, they can tie up a lion.", origin: "Ethiopian Proverb" },
      { text: "It takes a village to raise a child.", origin: "African Proverb" },
    ],
  },
];

// Interactive demo cards
const DEMO_CARDS = [
  { front: "Hurry, hurry has no blessing.", pillar: "Self-Regulation", origin: "Swahili", reflection: "This proverb invites us to slow down and be intentional. In moments of stress, rushing often leads to more mistakes. How can you practice patience today?" },
  { front: "I am because we are.", pillar: "Empathy", origin: "Ubuntu Philosophy", reflection: "Ubuntu reminds us that our humanity is bound up in one another. Your wellbeing is connected to those around you. Who in your community needs your support right now?" },
  { front: "Little by little, a little becomes a lot.", pillar: "Motivation", origin: "Tanzanian Proverb", reflection: "Progress doesn't require giant leaps. Small, consistent steps compound over time. What one small action can you take today toward your goal?" },
  { front: "A single hand cannot tie a bundle.", pillar: "Social Skills", origin: "African Proverb", reflection: "We are stronger together. Asking for help is not weakness — it's wisdom. Who could you collaborate with to achieve something neither of you could alone?" },
  { front: "Until the lion learns to write, every story will glorify the hunter.", pillar: "Self-Awareness", origin: "African Proverb", reflection: "Your story matters. Who is telling your narrative? Are you the author of your own life, or are you living someone else's version of who you should be?" },
];

export default function ZeraCards() {
  const [, navigate] = useLocation();
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [currentDemo, setCurrentDemo] = useState(0);

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.03_285)]">
      <NavBar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border text-sm font-medium mb-6 shadow-sm"
            style={{ borderColor: "oklch(0.88 0.06 285)", color: "oklch(0.45 0.18 285)" }}>
            🃏 African Wisdom × Emotional Intelligence
          </div>

          <div className="w-full max-w-2xl mx-auto h-3 rounded-full mb-6"
            style={{ background: "linear-gradient(to right, oklch(0.55 0.22 285), oklch(0.65 0.20 340), oklch(0.72 0.18 48), oklch(0.75 0.16 120))" }} />

          <h1 className="text-5xl font-black mb-2" style={{ color: "oklch(0.18 0.04 260)" }}>ZERA Cards</h1>
          <p className="text-xl font-semibold mb-4" style={{ color: "oklch(0.45 0.18 48)" }}>
            Bridging Ancient African Wisdom — Modern Emotional Intelligence
          </p>
          <p className="max-w-2xl mx-auto leading-relaxed" style={{ color: "oklch(0.45 0.04 260)" }}>
            Experience the power of 150 African-inspired proverbs transformed into a life-changing Emotional Intelligence card game and learning platform.
          </p>
        </div>

        {/* Interactive Card Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "oklch(0.18 0.04 260)" }}>Try a Card</h2>
          <p className="text-center text-sm mb-8" style={{ color: "oklch(0.55 0.04 260)" }}>Click the card to reveal its reflection prompt</p>

          <div className="flex flex-col items-center gap-6">
            {/* Card flip */}
            <div
              className="w-72 h-48 cursor-pointer"
              style={{ perspective: "1000px" }}
              onClick={() => setFlippedCard(flippedCard === currentDemo ? null : currentDemo)}
            >
              <div className="relative w-full h-full transition-transform duration-700"
                style={{ transformStyle: "preserve-3d", transform: flippedCard === currentDemo ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                {/* Front */}
                <div className="absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg"
                  style={{ backfaceVisibility: "hidden", background: "linear-gradient(135deg, oklch(0.22 0.08 285), oklch(0.35 0.14 285))" }}>
                  <div className="text-3xl mb-3">🌍</div>
                  <p className="text-white font-semibold text-sm leading-relaxed italic">
                    "{DEMO_CARDS[currentDemo].front}"
                  </p>
                  <p className="text-white/60 text-xs mt-3">— {DEMO_CARDS[currentDemo].origin}</p>
                  <Badge className="mt-3 bg-white/20 text-white border-0 text-xs">{DEMO_CARDS[currentDemo].pillar}</Badge>
                </div>
                {/* Back */}
                <div className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-center shadow-lg"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, oklch(0.92 0.06 48), oklch(0.96 0.04 75))" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.55 0.12 48)" }}>Reflection</p>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.22 0.06 48)" }}>{DEMO_CARDS[currentDemo].reflection}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full"
                onClick={() => { setCurrentDemo((p) => (p - 1 + DEMO_CARDS.length) % DEMO_CARDS.length); setFlippedCard(null); }}>
                ← Prev
              </Button>
              <span className="text-sm" style={{ color: "oklch(0.55 0.04 260)" }}>{currentDemo + 1} / {DEMO_CARDS.length}</span>
              <Button variant="outline" size="sm" className="rounded-full"
                onClick={() => { setCurrentDemo((p) => (p + 1) % DEMO_CARDS.length); setFlippedCard(null); }}>
                Next →
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full"
                onClick={() => setFlippedCard(null)}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </section>

        {/* 5 Pillars */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "oklch(0.18 0.04 260)" }}>Our 5 Pillars of Emotional Intelligence</h2>
          <p className="text-center text-sm mb-8" style={{ color: "oklch(0.55 0.04 260)" }}>Each pillar is brought to life through African proverbs from across the continent and diaspora</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PILLARS.map((pillar) => (
              <div key={pillar.id} className={`rounded-2xl p-6 bg-gradient-to-br ${pillar.color} border border-white/60 shadow-sm`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{pillar.icon}</span>
                  <div>
                    <h3 className="font-bold" style={{ color: "oklch(0.18 0.04 260)" }}>{pillar.name}</h3>
                    <p className="text-xs italic" style={{ color: "oklch(0.55 0.04 260)" }}>{pillar.desc}</p>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {pillar.proverbs.map((p, i) => (
                    <div key={i} className="bg-white/70 rounded-xl p-3">
                      <p className="text-xs italic font-medium" style={{ color: "oklch(0.22 0.04 260)" }}>"{p.text}"</p>
                      <p className="text-xs mt-1" style={{ color: "oklch(0.60 0.04 260)" }}>— {p.origin}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About ZERA */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl p-8 shadow-sm border" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: "oklch(0.18 0.04 260)" }}>About ZERA</h2>
            <p className="leading-relaxed mb-4" style={{ color: "oklch(0.35 0.04 260)" }}>
              ZERA is more than a card game. It is a <strong>movement to reimagine Emotional Intelligence (EI)</strong> through the timeless lens of African proverbs, cultural wisdom, and intergenerational storytelling. While most EI tools are rooted in Western psychology and corporate frameworks, ZERA introduces an approach that is culturally inclusive, deeply relational, and universally accessible.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: "oklch(0.35 0.04 260)" }}>
              At the heart of ZERA are <strong>150 carefully curated proverbs</strong> from across African nations and the diaspora, each mapped to one of the five pillars of EI: Self-Awareness, Self-Regulation, Empathy, Social Skills, and Motivation. These proverbs are not abstract sayings — they are <em>lived wisdom</em>, tested through centuries of community life, resilience, and adaptation.
            </p>
            <p className="leading-relaxed" style={{ color: "oklch(0.35 0.04 260)" }}>
              By engaging with them, players experience EI in a way that is not only intellectual but also <strong>spiritual, cultural, and communal</strong> — bridging ancient African wisdom with modern emotional intelligence.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="rounded-3xl p-8 text-white"
            style={{ background: "linear-gradient(135deg, oklch(0.22 0.08 285), oklch(0.35 0.14 285))" }}>
            <div className="text-4xl mb-4">🌍</div>
            <h2 className="text-2xl font-bold mb-3">Get the ZERA Card Game</h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Experience the full ZERA card game with all 150 proverbs. Available for purchase at zeracards.com — perfect for classrooms, workshops, and personal growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.open("https://zeracards.com", "_blank")}
                className="rounded-full font-semibold px-8"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 48), oklch(0.80 0.16 75))" }}>
                Visit zeracards.com <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/learn-ei")} variant="outline"
                className="rounded-full font-semibold border-white/40 text-white hover:bg-white/10 bg-transparent">
                Learn the 5 Pillars of EI
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
