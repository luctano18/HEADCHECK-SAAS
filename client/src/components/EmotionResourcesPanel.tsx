/**
 * EmotionResourcesPanel
 * Displays 3 contextual resources (articles, exercises, proverbs) tailored to
 * the user's detected emotion. Shown in CheckInResult.tsx after Pattern Insight.
 */
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { BookOpen, Dumbbell, FileText, Lightbulb, ArrowRight, Loader2 } from "lucide-react";
import type { ResourceType } from "@shared/emotionResources";

// ─── Type badge config ────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<ResourceType, { icon: React.ReactNode; color: string }> = {
  Article: { icon: <FileText className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700" },
  Exercise: { icon: <Dumbbell className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700" },
  Proverb: { icon: <BookOpen className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700" },
  Tool: { icon: <Lightbulb className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700" },
  Video: { icon: <FileText className="w-3.5 h-3.5" />, color: "bg-violet-100 text-violet-700" },
  Book: { icon: <BookOpen className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-700" },
};

interface Props {
  emotion: string;
}

export default function EmotionResourcesPanel({ emotion }: Props) {
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.checkIns.getEmotionResources.useQuery(
    { emotion },
    { enabled: !!emotion, staleTime: Infinity }
  );

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-5 flex items-center gap-3 animate-fade-in-up">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading resources for you…</p>
      </div>
    );
  }

  if (!data) return null;

  // Category → URL filter param mapping for /resources page
  const categoryParam = encodeURIComponent(data.resources[0]?.category ?? "Self-Awareness");

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-sky-50 border-indigo-200 p-5 space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Recommended for You
            </span>
          </div>
          <p className="text-sm text-indigo-900 font-medium leading-snug">{data.headline}</p>
        </div>
      </div>

      {/* Resource cards */}
      <div className="space-y-3">
        {data.resources.map((resource) => {
          const cfg = TYPE_CONFIG[resource.type] ?? TYPE_CONFIG.Article;
          return (
            <div
              key={resource.id}
              className="bg-white/80 rounded-xl border border-indigo-100 p-4 space-y-2 hover:shadow-sm transition-shadow"
            >
              {/* Type badge + duration */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                  {cfg.icon}
                  {resource.type}
                </span>
                <span className="text-xs text-muted-foreground">{resource.duration}</span>
              </div>

              {/* Title */}
              <p className="font-semibold text-sm text-foreground leading-snug">{resource.title}</p>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{resource.description}</p>

              {/* Inline proverb (for Proverb type) */}
              {resource.proverb && (
                <blockquote className="border-l-4 border-orange-300 pl-3 mt-2">
                  <p className="font-serif text-sm italic text-foreground">"{resource.proverb.text}"</p>
                  <p className="text-xs text-muted-foreground mt-0.5">— {resource.proverb.origin}</p>
                </blockquote>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <button
        onClick={() => navigate(`/resources?category=${categoryParam}`)}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900 transition-colors pt-1"
      >
        See all resources
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
