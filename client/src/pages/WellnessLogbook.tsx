import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { BookOpen, ArrowLeft, Search, Filter, ChevronRight } from "lucide-react";

const EMOTION_COLORS: Record<string, string> = {
  Happy: "#F59E0B",
  Calm: "#0D9488",
  Grateful: "#10B981",
  Sad: "#4338CA",
  Anxious: "#F97316",
  Frustrated: "#E11D48",
  Angry: "#DC2626",
  Exhausted: "#6366F1",
  Numb: "#9CA3AF",
  Confused: "#818CF8",
  Motivated: "#22C55E",
  Vulnerable: "#FB923C",
};

export default function WellnessLogbook() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: entries, isLoading } = trpc.dashboard.getWellnessLogbook.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  const filtered = (entries ?? []).filter((e) => {
    const matchEmotion = !emotionFilter || e.emotion === emotionFilter;
    const matchSearch = !search || (e.journalEntry ?? "").toLowerCase().includes(search.toLowerCase()) || e.emotion.toLowerCase().includes(search.toLowerCase());
    return matchEmotion && matchSearch;
  });

  const emotions = Array.from(new Set((entries ?? []).map((e) => e.emotion))).sort();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Wellness Logbook
            </h1>
            <p className="text-sm text-muted-foreground">Your journal entries from check-ins</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <div className="relative">
            <select
              value={emotionFilter ?? ""}
              onChange={(e) => setEmotionFilter(e.target.value || null)}
              className="h-10 rounded-xl border border-input bg-background px-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
            >
              <option value="">All emotions</option>
              {emotions.map((em) => (
                <option key={em} value={em}>{em}</option>
              ))}
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Stats bar */}
        {entries && entries.length > 0 && (
          <div className="flex items-center gap-4 px-1">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{entries.length}</span> journal entries total
            </span>
            {emotionFilter && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setEmotionFilter(null)}
              >
                {emotionFilter} ×
              </Badge>
            )}
          </div>
        )}

        {/* Entries */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center space-y-3">
              <span className="text-4xl">📓</span>
              <p className="text-muted-foreground text-sm">
                {entries?.length === 0
                  ? "No journal entries yet. Add notes during your next check-in!"
                  : "No entries match your filter."}
              </p>
              {entries?.length === 0 && (
                <Button size="sm" onClick={() => navigate("/checkin")}>Start a Check-In</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => {
              const color = EMOTION_COLORS[entry.emotion] ?? "#6366F1";
              const isOpen = expanded === entry.id;
              const preview = (entry.journalEntry ?? "").slice(0, 120);
              const hasMore = (entry.journalEntry ?? "").length > 120;
              return (
                <Card
                  key={entry.id}
                  className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{entry.emotionEmoji ?? "💭"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-sm font-semibold"
                            style={{ color }}
                          >
                            {entry.emotion}
                          </span>
                          <Badge variant="outline" className="text-xs">{entry.intensity}/10</Badge>
                          <Badge variant="secondary" className="text-xs">{entry.context}</Badge>
                          <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(entry.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
                          {isOpen ? entry.journalEntry : preview}
                          {!isOpen && hasMore && (
                            <span className="text-primary font-medium"> … read more</span>
                          )}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}
                      />
                    </div>
                    {isOpen && (
                      <div className="pt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/checkin/result/${entry.id}`); }}
                          className="text-xs text-primary"
                        >
                          View full check-in →
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
