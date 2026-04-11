import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Brain, ArrowLeft, Search, BookOpen, Video, FileText, Dumbbell, Wrench, Clock } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

type Category = "All" | "Self-Awareness" | "Self-Management" | "Social Awareness" | "Relationship Management" | "Neuroscience" | "African Wisdom";
type ResourceType = "All" | "Article" | "Video" | "Book" | "Exercise" | "Tool";

interface Resource {
  id: number;
  type: ResourceType;
  category: Category;
  title: string;
  description: string;
  duration: string;
  proverb?: string;
  proverbOrigin?: string;
}

const RESOURCES: Resource[] = [
  { id: 1, type: "Article", category: "Neuroscience", title: "Understanding Your Amygdala: The Brain's Alarm System", description: "Learn how your amygdala triggers stress responses. Understanding this helps you recognize when your fight-or-flight response is activated during challenging moments.", duration: "5 min read" },
  { id: 2, type: "Video", category: "Neuroscience", title: "The Prefrontal Cortex and Decision Making", description: "Discover how stress affects your prefrontal cortex — the part of your brain responsible for planning, decision-making, and emotional regulation.", duration: "8 min" },
  { id: 3, type: "Article", category: "Neuroscience", title: "Neuroplasticity: Your Brain Can Change", description: "Understand how your brain forms new neural pathways through practice and repetition. Emotional intelligence skills can be developed and strengthened over time.", duration: "6 min read" },
  { id: 4, type: "Exercise", category: "Neuroscience", title: "The Stress Response: From Brain to Body", description: "An interactive exercise to identify how stress manifests in your body. Learn to recognize the physical signs of amygdala activation and interrupt the stress cycle.", duration: "10 min" },
  { id: 5, type: "Tool", category: "Self-Awareness", title: "Permission to Pause", description: "A guided breathing exercise that activates your parasympathetic nervous system, helping shift your brain from stress mode to calm mode.", duration: "3 min", proverb: "Hurry, hurry has no blessing.", proverbOrigin: "Swahili" },
  { id: 6, type: "Exercise", category: "Self-Awareness", title: "Emotional Awareness Journal", description: "A daily practice to identify and name your emotions. Research shows that labeling emotions activates your prefrontal cortex and calms your amygdala.", duration: "5–10 min daily" },
  { id: 7, type: "Exercise", category: "Self-Awareness", title: "Triggers and Patterns Workbook", description: "Identify your personal stress triggers and emotional patterns. Understanding what activates your stress response helps you develop proactive strategies.", duration: "20 min" },
  { id: 8, type: "Exercise", category: "Self-Management", title: "The 5-4-3-2-1 Grounding Technique", description: "A sensory exercise that interrupts your stress response by engaging your prefrontal cortex through observation and naming. Brings you back to the present moment.", duration: "5 min" },
  { id: 9, type: "Tool", category: "Self-Management", title: "Emotional Regulation Toolkit", description: "A collection of evidence-based strategies: box breathing, progressive muscle relaxation, thought reframing, and more. Each tool targets different aspects of your stress response.", duration: "Varies" },
  { id: 10, type: "Article", category: "Self-Management", title: "From Overwhelm to Action: The Small Steps Method", description: "Learn how breaking tasks into tiny steps reduces amygdala activation and makes your prefrontal cortex more effective at planning and execution.", duration: "7 min read", proverb: "Little by little, a little becomes a lot.", proverbOrigin: "Tanzanian" },
  { id: 11, type: "Video", category: "Self-Management", title: "The Science of Self-Compassion", description: "Discover how self-criticism activates your threat response while self-compassion activates your care system, making it easier to learn from mistakes.", duration: "12 min" },
  { id: 12, type: "Article", category: "Social Awareness", title: "Reading Emotional Cues in Others", description: "Develop your ability to recognize emotions in others by understanding facial expressions, body language, and tone of voice.", duration: "6 min read" },
  { id: 13, type: "Article", category: "Social Awareness", title: "Cultural Intelligence and Empathy", description: "Learn how different cultures express and manage emotions. Understanding cultural context deepens empathy and strengthens relationships in diverse settings.", duration: "8 min read", proverb: "If you want to go fast, go alone. If you want to go far, go together.", proverbOrigin: "African" },
  { id: 14, type: "Exercise", category: "Relationship Management", title: "Asking for Help: A Strength, Not a Weakness", description: "Practice scripts and strategies for reaching out. Learn how your prefrontal cortex works better when you have social support.", duration: "15 min" },
  { id: 15, type: "Article", category: "Relationship Management", title: "Setting Boundaries Without Guilt", description: "Understand how saying 'no' protects your capacity and reduces overall stress. Learn communication strategies that maintain relationships while protecting your wellbeing.", duration: "7 min read" },
  { id: 16, type: "Tool", category: "Relationship Management", title: "Collaborative Learning Strategies", description: "Build study groups and peer support networks that enhance learning while providing emotional support. Social connection calms your stress response.", duration: "Varies", proverb: "A single hand cannot tie a bundle.", proverbOrigin: "African" },
  { id: 17, type: "Article", category: "African Wisdom", title: "African Proverbs for Emotional Resilience", description: "Explore how traditional African wisdom applies to modern emotional challenges. Each proverb contains insights about patience, community, persistence, and growth.", duration: "10 min read" },
  { id: 18, type: "Video", category: "African Wisdom", title: "Ubuntu Philosophy: 'I Am Because We Are'", description: "Learn about the African concept of Ubuntu and its application to daily life. Understand how community and interdependence reduce stress and enhance wellbeing.", duration: "15 min", proverb: "I am because we are.", proverbOrigin: "Ubuntu Philosophy" },
  { id: 19, type: "Exercise", category: "African Wisdom", title: "Wisdom from the Ancestors: Storytelling for Healing", description: "Use narrative and story to process your emotional journey. This practice honors African oral traditions while activating brain regions involved in meaning-making.", duration: "20 min" },
  { id: 20, type: "Book", category: "Self-Awareness", title: "Emotional Intelligence by Daniel Goleman", description: "The foundational text on emotional intelligence. Goleman explains the science behind EI and its impact on success in all areas of life.", duration: "Book" },
  { id: 21, type: "Book", category: "Neuroscience", title: "The Upward Spiral by Alex Korb", description: "A neuroscientist explains how small changes can create positive feedback loops in your brain, reducing anxiety and depression.", duration: "Book" },
  { id: 22, type: "Book", category: "Self-Management", title: "Self-Compassion by Kristin Neff", description: "Research-backed approaches to treating yourself with kindness, especially during struggles and setbacks.", duration: "Book" },
];

const CATEGORIES: Category[] = ["All", "Self-Awareness", "Self-Management", "Social Awareness", "Relationship Management", "Neuroscience", "African Wisdom"];
const TYPES: ResourceType[] = ["All", "Article", "Video", "Book", "Exercise", "Tool"];

const TYPE_ICONS: Record<ResourceType, React.ReactNode> = {
  All: <BookOpen className="w-3.5 h-3.5" />,
  Article: <FileText className="w-3.5 h-3.5" />,
  Video: <Video className="w-3.5 h-3.5" />,
  Book: <BookOpen className="w-3.5 h-3.5" />,
  Exercise: <Dumbbell className="w-3.5 h-3.5" />,
  Tool: <Wrench className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<ResourceType, string> = {
  All: "bg-muted text-muted-foreground",
  Article: "bg-blue-100 text-blue-700",
  Video: "bg-violet-100 text-violet-700",
  Book: "bg-amber-100 text-amber-700",
  Exercise: "bg-green-100 text-green-700",
  Tool: "bg-orange-100 text-orange-700",
};

const CATEGORY_ICONS: Record<Category, string> = {
  All: "📚",
  "Self-Awareness": "🧠",
  "Self-Management": "🌊",
  "Social Awareness": "👁️",
  "Relationship Management": "🤝",
  Neuroscience: "⚡",
  "African Wisdom": "🌍",
};

export default function Resources() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [activeType, setActiveType] = useState<ResourceType>("All");

  const filtered = useMemo(() => {
    return RESOURCES.filter(r => {
      const matchCat = activeCategory === "All" || r.category === activeCategory;
      const matchType = activeType === "All" || r.type === activeType;
      const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchType && matchSearch;
    });
  }, [activeCategory, activeType, search]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Hero */}
      <div className="hc-gradient-warm py-12">
        <div className="container max-w-3xl text-center space-y-3">
          <div className="hc-gradient-bar h-1.5 rounded-full max-w-xs mx-auto mb-4" />
          <h1 className="font-serif text-4xl font-bold text-foreground">Resources Library</h1>
          <p className="text-muted-foreground">Curated articles, videos, books, exercises, and tools to deepen your emotional intelligence practice</p>
          <div className="relative max-w-md mx-auto mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/90 border-white/50 rounded-xl h-11"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-8 space-y-6">
        {/* Category Filter */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Filter by Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                  activeCategory === cat
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white text-foreground border-border hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Filter by Type</p>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(type => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                  activeType === type
                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                    : "bg-white text-foreground border-border hover:border-violet-300 hover:bg-violet-50"
                }`}
              >
                {TYPE_ICONS[type]}
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">{filtered.length} resource{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => (
            <div key={resource.id} className="bg-white rounded-2xl border shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${TYPE_COLORS[resource.type]}`}>
                  {TYPE_ICONS[resource.type]}
                  {resource.type}
                </span>
                <span className="text-xs text-muted-foreground">{CATEGORY_ICONS[resource.category]}</span>
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="font-semibold text-foreground text-sm leading-snug">{resource.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{resource.description}</p>
              </div>
              {resource.proverb && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-xs font-medium text-amber-800 italic">"{resource.proverb}"</p>
                  <p className="text-xs text-amber-600 mt-0.5">— {resource.proverbOrigin}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {resource.duration}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">🔍</div>
            <p className="font-semibold text-foreground">No resources found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
            <Button variant="outline" onClick={() => { setSearch(""); setActiveCategory("All"); setActiveType("All"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
