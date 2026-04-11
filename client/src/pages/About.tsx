import { Heart, Brain, Globe, Users, Sparkles, Shield, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const VALUES = [
  {
    icon: Heart,
    title: "Emotional Authenticity",
    description: "We believe in honoring the full spectrum of human emotion — not suppressing or bypassing feelings, but learning to understand and work with them.",
    color: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-500",
  },
  {
    icon: Globe,
    title: "African Intelligence (AIEI)",
    description: "We integrate the wisdom of African proverbs and Ubuntu philosophy into modern emotional intelligence — because healing is also cultural and communal.",
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-500",
  },
  {
    icon: Brain,
    title: "Neuroscience-Backed",
    description: "Our insights are grounded in the latest neuroscience research on how emotions are processed in the brain, making our guidance both meaningful and accurate.",
    color: "bg-violet-50 border-violet-200",
    iconColor: "text-violet-500",
  },
  {
    icon: Shield,
    title: "Privacy & Safety First",
    description: "Your emotional data is deeply personal. We are committed to the highest standards of privacy, security, and ethical AI use in everything we build.",
    color: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-500",
  },
  {
    icon: Users,
    title: "Community & Connection",
    description: "Emotional wellbeing is not a solo journey. We build tools that support both individuals and communities — schools, organizations, and families.",
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-500",
  },
  {
    icon: Sparkles,
    title: "Accessible to All",
    description: "Emotional intelligence should not be a privilege. We offer free access to core tools so anyone, anywhere, can begin their inner journey.",
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-500",
  },
];

const TEAM = [
  {
    name: "Rémi Douah",
    role: "Founder & Chief Emotional Intelligence Officer",
    bio: "Rémi is a certified emotional intelligence practitioner with over a decade of experience supporting youth, educators, and organizations across Africa and North America. His vision is to make emotional intelligence accessible to every person, rooted in both science and African wisdom.",
    emoji: "🌍",
    color: "from-amber-50 to-orange-50 border-amber-200",
  },
];

const AIEI_PROVERBS = [
  { proverb: "Until the lion learns to write, every story will glorify the hunter.", origin: "African Proverb", meaning: "Your story deserves to be told in your own words." },
  { proverb: "A child who is not embraced by the village will burn it down to feel its warmth.", origin: "African Proverb", meaning: "Community and belonging are fundamental human needs." },
  { proverb: "He who learns, teaches.", origin: "Ethiopian Proverb", meaning: "Growth is meant to be shared." },
  { proverb: "If you want to go fast, go alone. If you want to go far, go together.", origin: "African Proverb", meaning: "Sustainable growth is collective." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 pt-20 pb-16">

      {/* Hero */}
      <section className="px-4 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200 shadow-sm mb-6">
          <Heart className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">Our Story</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Emotional Intelligence,<br />
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Rooted in African Wisdom</span>
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          HeadCheck AI was born from a simple belief: every person deserves access to tools that help them understand their emotions, build resilience, and live with greater clarity and purpose — grounded in both modern neuroscience and the timeless wisdom of African philosophy.
        </p>
      </section>

      {/* Mission */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We exist to democratize emotional intelligence. Too often, the tools and language of emotional wellness have been inaccessible — either too clinical, too expensive, or disconnected from the lived experiences of people in the Global South.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              HeadCheck AI bridges that gap by combining the rigor of modern neuroscience with the depth of African Integrated Emotional Intelligence (AIEI) — a framework that honors community, storytelling, and ancestral wisdom as valid and powerful sources of emotional knowledge.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Free core access", "African wisdom", "Neuroscience-backed", "Privacy-first"].map(tag => (
                <span key={tag} className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">{tag}</span>
              ))}
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-amber-100 shadow-lg">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">What is AIEI?</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              <strong>African Integrated Emotional Intelligence (AIEI)</strong> is a framework developed to honor the emotional wisdom embedded in African cultures, proverbs, and Ubuntu philosophy — "I am because we are."
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              AIEI recognizes that emotional intelligence is not just an individual skill but a communal practice — shaped by our relationships, our stories, and our collective healing.
            </p>
          </div>
        </div>
      </section>

      {/* AIEI Proverbs */}
      <section className="px-4 py-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wisdom That Guides Us</h2>
            <p className="text-gray-500 text-sm">African proverbs that shape our approach to emotional intelligence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AIEI_PROVERBS.map((item, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-amber-100 shadow-sm">
                <blockquote className="text-gray-800 font-medium italic mb-3 leading-relaxed">
                  "{item.proverb}"
                </blockquote>
                <p className="text-xs text-amber-600 font-medium mb-2">— {item.origin}</p>
                <p className="text-sm text-gray-500">{item.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">What We Stand For</h2>
          <p className="text-gray-500">The principles that guide every decision we make</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className={`bg-gradient-to-br ${value.color} rounded-2xl p-6 border`}>
                <div className="w-10 h-10 bg-white/70 rounded-xl flex items-center justify-center mb-4">
                  <Icon className={`w-5 h-5 ${value.iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team */}
      <section className="px-4 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">The Team</h2>
          <p className="text-gray-500">The people behind HeadCheck AI</p>
        </div>
        <div className="flex justify-center">
          {TEAM.map((member) => (
            <div key={member.name} className={`bg-gradient-to-br ${member.color} rounded-3xl p-8 border max-w-lg w-full`}>
              <div className="text-5xl mb-4">{member.emoji}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
              <p className="text-amber-600 font-medium text-sm mb-4">{member.role}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-10 text-white shadow-xl">
          <Star className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-3">Begin Your Journey</h2>
          <p className="text-amber-100 mb-6 leading-relaxed">
            No account needed to start. Take your first Emotional Check-In right now — free, private, and grounded in wisdom.
          </p>
          <Link href="/checkin">
            <Button className="bg-white text-amber-600 hover:bg-amber-50 rounded-xl px-8 font-semibold">
              Start Free Check-In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
