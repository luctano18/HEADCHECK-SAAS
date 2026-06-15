import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search, X, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

// ─── Feeling Wheel Data ───────────────────────────────────────────────────────
// Core emotions → secondary emotions → tertiary emotions
const WHEEL: {
  core: string;
  color: string;
  bg: string;
  ring: string;
  secondary: {
    name: string;
    tertiary: string[];
  }[];
}[] = [
  {
    core: "Joy",
    color: "text-amber-700",
    bg: "bg-amber-100",
    ring: "ring-amber-400",
    secondary: [
      { name: "Elated", tertiary: ["Jubilant", "Exhilarated", "Ecstatic"] },
      { name: "Happy", tertiary: ["Cheerful", "Joyful", "Delighted"] },
      { name: "Content", tertiary: ["Satisfied", "Pleased", "Fulfilled"] },
      { name: "Hopeful", tertiary: ["Optimistic", "Encouraged", "Inspired"] },
      { name: "Playful", tertiary: ["Amused", "Silly", "Energetic"] },
      { name: "Proud", tertiary: ["Confident", "Triumphant", "Worthy"] },
    ],
  },
  {
    core: "Love",
    color: "text-rose-700",
    bg: "bg-rose-100",
    ring: "ring-rose-400",
    secondary: [
      { name: "Affectionate", tertiary: ["Tender", "Caring", "Warm"] },
      { name: "Grateful", tertiary: ["Appreciative", "Thankful", "Blessed"] },
      { name: "Connected", tertiary: ["Belonging", "Accepted", "Understood"] },
      { name: "Compassionate", tertiary: ["Empathetic", "Nurturing", "Kind"] },
      { name: "Romantic", tertiary: ["Passionate", "Longing", "Devoted"] },
      { name: "Trusting", tertiary: ["Safe", "Secure", "Vulnerable"] },
    ],
  },
  {
    core: "Surprise",
    color: "text-purple-700",
    bg: "bg-purple-100",
    ring: "ring-purple-400",
    secondary: [
      { name: "Amazed", tertiary: ["Astonished", "Awestruck", "Speechless"] },
      { name: "Confused", tertiary: ["Perplexed", "Disorientated", "Lost"] },
      { name: "Startled", tertiary: ["Shocked", "Jolted", "Caught off guard"] },
      { name: "Curious", tertiary: ["Intrigued", "Fascinated", "Inquisitive"] },
      { name: "Excited", tertiary: ["Eager", "Enthusiastic", "Anticipating"] },
      { name: "Moved", tertiary: ["Touched", "Stirred", "Inspired"] },
    ],
  },
  {
    core: "Fear",
    color: "text-blue-700",
    bg: "bg-blue-100",
    ring: "ring-blue-400",
    secondary: [
      { name: "Anxious", tertiary: ["Worried", "Nervous", "Apprehensive"] },
      { name: "Scared", tertiary: ["Terrified", "Panicked", "Threatened"] },
      { name: "Insecure", tertiary: ["Vulnerable", "Exposed", "Fragile"] },
      { name: "Overwhelmed", tertiary: ["Paralysed", "Helpless", "Powerless"] },
      { name: "Rejected", tertiary: ["Excluded", "Abandoned", "Unwanted"] },
      { name: "Uncertain", tertiary: ["Doubtful", "Hesitant", "Unsure"] },
    ],
  },
  {
    core: "Sadness",
    color: "text-indigo-700",
    bg: "bg-indigo-100",
    ring: "ring-indigo-400",
    secondary: [
      { name: "Lonely", tertiary: ["Isolated", "Disconnected", "Empty"] },
      { name: "Grief", tertiary: ["Heartbroken", "Devastated", "Mourning"] },
      { name: "Disappointed", tertiary: ["Let down", "Discouraged", "Disillusioned"] },
      { name: "Hopeless", tertiary: ["Defeated", "Despairing", "Stuck"] },
      { name: "Hurt", tertiary: ["Wounded", "Betrayed", "Pained"] },
      { name: "Guilty", tertiary: ["Remorseful", "Ashamed", "Regretful"] },
    ],
  },
  {
    core: "Disgust",
    color: "text-green-700",
    bg: "bg-green-100",
    ring: "ring-green-400",
    secondary: [
      { name: "Repulsed", tertiary: ["Revolted", "Nauseated", "Averse"] },
      { name: "Contemptuous", tertiary: ["Scornful", "Disdainful", "Dismissive"] },
      { name: "Judgmental", tertiary: ["Critical", "Disapproving", "Intolerant"] },
      { name: "Embarrassed", tertiary: ["Humiliated", "Self-conscious", "Mortified"] },
      { name: "Uncomfortable", tertiary: ["Uneasy", "Awkward", "Restless"] },
      { name: "Bored", tertiary: ["Indifferent", "Apathetic", "Disengaged"] },
    ],
  },
  {
    core: "Anger",
    color: "text-red-700",
    bg: "bg-red-100",
    ring: "ring-red-400",
    secondary: [
      { name: "Frustrated", tertiary: ["Irritated", "Annoyed", "Aggravated"] },
      { name: "Furious", tertiary: ["Enraged", "Outraged", "Livid"] },
      { name: "Resentful", tertiary: ["Bitter", "Spiteful", "Grudging"] },
      { name: "Jealous", tertiary: ["Envious", "Possessive", "Covetous"] },
      { name: "Provoked", tertiary: ["Offended", "Insulted", "Disrespected"] },
      { name: "Hostile", tertiary: ["Aggressive", "Threatening", "Combative"] },
    ],
  },
];

// Flatten all emotions for search
const ALL_EMOTIONS = WHEEL.flatMap(c =>
  c.secondary.flatMap(s =>
    [s.name, ...s.tertiary].map(name => ({ name, core: c.core, bg: c.bg, color: c.color }))
  )
);

export default function FeelingWheel() {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<{ core: string; secondary: string | null; tertiary: string | null }>({
    core: "",
    secondary: null,
    tertiary: null,
  });
  const [search, setSearch] = useState("");

  const selectedCore = WHEEL.find(c => c.core === selected.core);
  const selectedSecondary = selectedCore?.secondary.find(s => s.name === selected.secondary);

  const searchResults = search.trim().length >= 2
    ? ALL_EMOTIONS.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 12)
    : [];

  const handleCoreClick = (core: string) => {
    setSelected(prev => prev.core === core ? { core: "", secondary: null, tertiary: null } : { core, secondary: null, tertiary: null });
    setSearch("");
  };

  const handleSecondaryClick = (sec: string) => {
    setSelected(prev => ({ ...prev, secondary: prev.secondary === sec ? null : sec, tertiary: null }));
  };

  const handleTertiaryClick = (ter: string) => {
    setSelected(prev => ({ ...prev, tertiary: prev.tertiary === ter ? null : ter }));
  };

  const handleCheckIn = () => {
    const emotion = selected.tertiary ?? selected.secondary ?? selected.core;
    if (emotion) navigate(`/checkin?emotion=${encodeURIComponent(emotion)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container flex items-center justify-between h-14">
          <Button variant="ghost" size="sm" onClick={() => navigate("/resources")} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Resources
          </Button>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">Feeling Wheel</Badge>
        </div>
      </div>

      <div className="container max-w-4xl py-10 space-y-8">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Feeling Wheel</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Expand your emotional vocabulary. Start with a core emotion, then drill down to find the most precise word for what you're feeling.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search any emotion…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-9 rounded-full border border-input bg-background text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {searchResults.map(e => (
              <button
                key={e.name}
                onClick={() => {
                  const coreObj = WHEEL.find(c => c.core === e.core)!;
                  const secObj = coreObj.secondary.find(s => s.name === e.name || s.tertiary.includes(e.name));
                  setSelected({
                    core: e.core,
                    secondary: secObj?.name ?? null,
                    tertiary: secObj?.tertiary.includes(e.name) ? e.name : null,
                  });
                  setSearch("");
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${e.bg} ${e.color} hover:opacity-80`}
              >
                {e.name}
                <span className="ml-1.5 text-xs opacity-60">({e.core})</span>
              </button>
            ))}
          </div>
        )}

        {/* Core Emotions Ring */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">Step 1 — Choose a core emotion</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {WHEEL.map(c => (
              <button
                key={c.core}
                onClick={() => handleCoreClick(c.core)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm border-2 transition-all ${
                  selected.core === c.core
                    ? `${c.bg} ${c.color} ring-2 ${c.ring} scale-105 shadow-md`
                    : `bg-white ${c.color} border-current/30 hover:${c.bg}`
                }`}
              >
                {c.core}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Emotions */}
        {selectedCore && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Step 2 — Narrow it down <span className="text-foreground">({selectedCore.core})</span>
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedCore.secondary.map(s => (
                <button
                  key={s.name}
                  onClick={() => handleSecondaryClick(s.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    selected.secondary === s.name
                      ? `${selectedCore.bg} ${selectedCore.color} ring-2 ${selectedCore.ring} scale-105 shadow-sm`
                      : `bg-white ${selectedCore.color} border-current/20 hover:${selectedCore.bg}`
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tertiary Emotions */}
        {selectedSecondary && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Step 3 — Be specific <span className="text-foreground">({selectedSecondary.name})</span>
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedSecondary.tertiary.map(t => (
                <button
                  key={t}
                  onClick={() => handleTertiaryClick(t)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    selected.tertiary === t
                      ? `${selectedCore!.bg} ${selectedCore!.color} ring-2 ${selectedCore!.ring} scale-105 shadow-sm font-semibold`
                      : `bg-white ${selectedCore!.color} border-current/20 hover:${selectedCore!.bg}`
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {selected.core && (
          <Card className={`border-2 ${selectedCore?.ring?.replace("ring-", "border-")} shadow-sm`}>
            <CardContent className="py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">You're feeling</p>
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <span className={`text-2xl font-bold ${selectedCore?.color}`}>
                    {selected.tertiary ?? selected.secondary ?? selected.core}
                  </span>
                  {(selected.secondary || selected.tertiary) && (
                    <>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{selected.core}{selected.secondary ? ` › ${selected.secondary}` : ""}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected({ core: "", secondary: null, tertiary: null })}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  className="hc-gradient-orange border-0 text-white hover:opacity-90"
                  onClick={handleCheckIn}
                >
                  Start Check-In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How to Use */}
        <div className="bg-muted/30 rounded-2xl p-6 space-y-3">
          <h3 className="font-semibold text-foreground">How to use the Feeling Wheel</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Start with the <strong>core emotion</strong> that feels closest to your current state.</li>
            <li>Move to the <strong>secondary layer</strong> to find a more nuanced description.</li>
            <li>Explore the <strong>tertiary layer</strong> for the most precise word.</li>
            <li>Use the selected emotion to <strong>start a check-in</strong> and receive personalised AI guidance.</li>
          </ol>
          <p className="text-xs text-muted-foreground pt-1">
            Research shows that naming emotions precisely — a skill called <em>emotional granularity</em> — reduces their intensity and helps you respond more effectively.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
