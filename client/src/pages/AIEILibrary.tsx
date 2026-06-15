import { useState, useMemo } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Globe, Filter, X } from "lucide-react";

// ─── AIEI Proverbs Data ───────────────────────────────────────────────────────
const AIEI_PROVERBS = [
  // Self-Awareness
  { id: 1, proverb: "Know yourself and you will win all battles.", country: "China (adopted in Africa)", region: "East Africa", pillar: "Self-Awareness", explanation: "Understanding your own strengths and weaknesses is the foundation of all wisdom and success." },
  { id: 2, proverb: "The one who tells the stories rules the world.", country: "Hopi (Native wisdom)", region: "West Africa", pillar: "Self-Awareness", explanation: "The narratives we tell ourselves shape our reality. Knowing your inner story is the first step to changing it." },
  { id: 3, proverb: "Until the lion learns to write, every story will glorify the hunter.", country: "Nigeria", region: "West Africa", pillar: "Self-Awareness", explanation: "Your perspective matters. Knowing your own truth is essential to claiming your voice." },
  { id: 4, proverb: "A child who is not embraced by the village will burn it down to feel its warmth.", country: "African Proverb", region: "Pan-African", pillar: "Self-Awareness", explanation: "Unmet needs for belonging and recognition express themselves in powerful ways. Understanding your needs is the first step to meeting them." },
  { id: 5, proverb: "Rain does not fall on one roof alone.", country: "Cameroon", region: "Central Africa", pillar: "Self-Awareness", explanation: "Our emotions and experiences are shared human experiences. You are not alone in what you feel." },

  // Self-Regulation
  { id: 6, proverb: "Speak softly and carry a big stick.", country: "West Africa (popularized globally)", region: "West Africa", pillar: "Self-Regulation", explanation: "True power lies in restraint. Managing your reactions preserves your energy for what truly matters." },
  { id: 7, proverb: "The forest would be silent if no bird sang except the one that sang best.", country: "Kenya", region: "East Africa", pillar: "Self-Regulation", explanation: "Patience and knowing when to act — and when to wait — is a form of emotional mastery." },
  { id: 8, proverb: "When the music changes, so does the dance.", country: "Nigeria (Hausa)", region: "West Africa", pillar: "Self-Regulation", explanation: "Adaptability is a sign of emotional intelligence. Adjusting your response to changing circumstances is wisdom." },
  { id: 9, proverb: "Patience is the mother of a beautiful child.", country: "Bantu proverb", region: "Southern Africa", pillar: "Self-Regulation", explanation: "Emotional regulation — the ability to wait, breathe, and respond rather than react — creates better outcomes." },
  { id: 10, proverb: "He who runs alone will win the race, but he who runs with others will go further.", country: "Ethiopia", region: "East Africa", pillar: "Self-Regulation", explanation: "Slowing down and collaborating, rather than reacting impulsively, leads to greater and more sustainable success." },

  // Motivation
  { id: 11, proverb: "However long the night, the dawn will break.", country: "Guinea", region: "West Africa", pillar: "Motivation", explanation: "Even in the darkest moments, hope and persistence carry us forward. Your struggles are temporary." },
  { id: 12, proverb: "A river that forgets its source will dry up.", country: "Ghana", region: "West Africa", pillar: "Motivation", explanation: "Staying connected to your purpose and values keeps your motivation alive and your direction clear." },
  { id: 13, proverb: "If you want to go fast, go alone. If you want to go far, go together.", country: "African Proverb", region: "Pan-African", pillar: "Motivation", explanation: "Sustainable motivation is fueled by community, shared purpose, and the knowledge that your journey matters to others." },
  { id: 14, proverb: "The tree does not know its own height until it is cut down.", country: "Swahili proverb", region: "East Africa", pillar: "Motivation", explanation: "We often underestimate our own strength and resilience. Challenges reveal capacities we didn't know we had." },
  { id: 15, proverb: "A person is a person because of other people.", country: "Zulu (Ubuntu)", region: "Southern Africa", pillar: "Motivation", explanation: "Ubuntu — I am because we are. Our motivation is deepened when we recognize our interconnectedness." },

  // Empathy
  { id: 16, proverb: "Before healing others, heal yourself.", country: "African Proverb", region: "Pan-African", pillar: "Empathy", explanation: "True empathy begins with self-compassion. You cannot pour from an empty cup." },
  { id: 17, proverb: "The axe forgets, but the tree remembers.", country: "Zimbabwe", region: "Southern Africa", pillar: "Empathy", explanation: "Our words and actions leave lasting impressions on others. Empathy asks us to consider the impact of our actions beyond our own experience." },
  { id: 18, proverb: "Do not look where you fell, but where you slipped.", country: "Liberia", region: "West Africa", pillar: "Empathy", explanation: "Understanding the root causes of others' struggles — not just their visible failures — is the essence of empathy." },
  { id: 19, proverb: "One who causes others misfortune also teaches them.", country: "Akan proverb", region: "West Africa", pillar: "Empathy", explanation: "Every interaction, even painful ones, carries a lesson. Empathy allows us to learn from both joy and pain." },
  { id: 20, proverb: "The child who is not loved by its mother will always be seeking love.", country: "African Proverb", region: "Pan-African", pillar: "Empathy", explanation: "Understanding the unmet needs beneath behavior is the foundation of compassionate empathy." },

  // Social Skills
  { id: 21, proverb: "A single bracelet does not jingle.", country: "Congo", region: "Central Africa", pillar: "Social Skills", explanation: "We create meaning, joy, and impact through connection. Social harmony is built through collaboration and mutual respect." },
  { id: 22, proverb: "Cross the river in a crowd and the crocodile won't eat you.", country: "Madagascar", region: "East Africa", pillar: "Social Skills", explanation: "Navigating life's challenges is easier — and safer — when we build strong social bonds and move together." },
  { id: 23, proverb: "Two ants do not fail to pull one grasshopper.", country: "Tanzania", region: "East Africa", pillar: "Social Skills", explanation: "Cooperation and communication multiply our individual capacities. Together, we can accomplish what seems impossible alone." },
  { id: 24, proverb: "The strength of the crocodile is the water.", country: "African Proverb", region: "Pan-African", pillar: "Social Skills", explanation: "We are strongest in our natural environment — our community. Social skills help us build and maintain the relationships that sustain us." },
  { id: 25, proverb: "Wisdom is like a baobab tree; no one individual can embrace it.", country: "Akan proverb", region: "West Africa", pillar: "Social Skills", explanation: "No one person has all the answers. Listening, learning from others, and sharing knowledge are the highest social skills." },
];

const PILLARS = ["All", "Self-Awareness", "Self-Regulation", "Motivation", "Empathy", "Social Skills"];
const REGIONS = ["All", "West Africa", "East Africa", "Central Africa", "Southern Africa", "Pan-African"];

export default function AIEILibrary() {
  const [search, setSearch] = useState("");
  const [selectedPillar, setSelectedPillar] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return AIEI_PROVERBS.filter((p) => {
      const matchSearch = !search || 
        p.proverb.toLowerCase().includes(search.toLowerCase()) ||
        p.country.toLowerCase().includes(search.toLowerCase()) ||
        p.explanation.toLowerCase().includes(search.toLowerCase());
      const matchPillar = selectedPillar === "All" || p.pillar === selectedPillar;
      const matchRegion = selectedRegion === "All" || p.region === selectedRegion;
      return matchSearch && matchPillar && matchRegion;
    });
  }, [search, selectedPillar, selectedRegion]);

  const clearFilters = () => {
    setSearch("");
    setSelectedPillar("All");
    setSelectedRegion("All");
  };

  const hasFilters = search || selectedPillar !== "All" || selectedRegion !== "All";

  const PILLAR_COLORS: Record<string, string> = {
    "Self-Awareness": "bg-rose-100 text-rose-700",
    "Self-Regulation": "bg-amber-100 text-amber-700",
    "Motivation": "bg-green-100 text-green-700",
    "Empathy": "bg-sky-100 text-sky-700",
    "Social Skills": "bg-violet-100 text-violet-700",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      {/* Hero */}
      <section className="pt-24 pb-10 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            🌍 AIEI Content Library
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            African Wisdom Library
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Explore {AIEI_PROVERBS.length} African proverbs mapped to the 5 pillars of Emotional Intelligence.
            Search by country, region, or EI pillar.
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="px-4 pb-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search proverbs, countries, or themes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>

          {/* Pillar Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">EI Pillar</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map((pillar) => (
                <button
                  key={pillar}
                  onClick={() => setSelectedPillar(pillar)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedPillar === pillar
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {pillar}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Region</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedRegion === region
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Results count + clear */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{filtered.length}</strong> of {AIEI_PROVERBS.length} proverbs
            </p>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="w-3.5 h-3.5" /> Clear filters
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Proverbs Grid */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground">No proverbs match your search.</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border bg-card p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <blockquote className="font-serif text-lg italic text-foreground leading-relaxed border-l-4 border-amber-300 pl-4 mb-3">
                      "{item.proverb}"
                    </blockquote>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PILLAR_COLORS[item.pillar]}`}>
                        {item.pillar}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {item.country}
                      </span>
                      <span className="text-xs text-muted-foreground">· {item.region}</span>
                    </div>
                  </div>
                </div>
                {expanded === item.id && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      {item.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
