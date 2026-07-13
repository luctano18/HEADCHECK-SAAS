import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Brain, Heart, Sparkles, ArrowRight, Loader2,
  TrendingUp, Calendar, Award, Plus, ChevronRight,
  BookOpen, Download
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import MoodTrendChart from "@/components/MoodTrendChart";
import { PieChartSkeleton, AreaChartSkeleton } from "@/components/ChartSkeleton";
import EmotionDistributionChart from "@/components/EmotionDistributionChart";
import CheckInActivityChart from "@/components/CheckInActivityChart";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import { LevelProgress } from "@/components/LevelProgress";
import { WeeklyChallenges } from "@/components/WeeklyChallenges";

// Brand-aligned emotion palette: Indigo primary, Coral accent, Teal, Amber, Rose
const EMOTION_COLORS: Record<string, string> = {
  Happy: "#F59E0B",       // Amber — warmth, joy
  Calm: "#0D9488",        // Teal — serenity
  Grateful: "#10B981",   // Emerald — growth
  Sad: "#4338CA",         // Indigo — depth
  Anxious: "#F97316",    // Coral — tension
  Frustrated: "#E11D48", // Rose — intensity
  Angry: "#DC2626",      // Red — urgency
  Exhausted: "#6366F1",  // Violet — fatigue
  Numb: "#9CA3AF",       // Gray — disconnection
  Confused: "#818CF8",   // Indigo light — uncertainty
  Motivated: "#22C55E",  // Green — energy
  Vulnerable: "#FB923C", // Orange — openness
};

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.dashboard.getHistory.useQuery(undefined, { enabled: isAuthenticated });
  const { data: quizHistory } = trpc.quiz.getHistory.useQuery(undefined, { enabled: isAuthenticated });
  const [isExporting, setIsExporting] = useState(false);
  const { refetch: refetchExport } = trpc.dashboard.exportCheckIns.useQuery(
    { days: 90 },
    { enabled: false }
  );

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await refetchExport();
      const rows = result.data ?? [];
      if (rows.length === 0) {
        toast.info("No check-ins to export yet.");
        return;
      }
      const header = "Date,Time,Emotion,Intensity,Context,Journal Entry";
      const csvRows = rows.map((r) =>
        [r.date, r.time, r.emotion, r.intensity, `"${r.context}"`, `"${(r.journalEntry ?? "").replace(/"/g, "'")}"`].join(",")
      );
      const blob = new Blob([[header, ...csvRows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `headcheck-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} check-ins.`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Show skeleton layout while data loads (instead of full-page spinner)
  const showSkeleton = loading || isLoading;

  // Only redirect if we know the user is not authenticated (not while loading)
  if (!loading && !isAuthenticated) { navigate("/"); return null; }

  const checkIns = data?.checkIns ?? [];
  const mirrorSessions = data?.mirrorSessions ?? [];
  const streak = data?.streak;
  const achievements = data?.achievements ?? [];

  // Build chart data from check-ins
  const chartData = checkIns.slice().reverse().slice(-14).map((ci) => ({
    date: format(new Date(ci.createdAt), "MMM d"),
    intensity: ci.intensity,
    emotion: ci.emotion,
  }));

  const avgIntensity = checkIns.length
    ? (checkIns.reduce((s, c) => s + c.intensity, 0) / checkIns.length).toFixed(1)
    : "—";

  const mostFrequentEmotion = checkIns.length
    ? Object.entries(checkIns.reduce((acc, c) => ({ ...acc, [c.emotion]: (acc[c.emotion] ?? 0) + 1 }), {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />

      <div className="container max-w-5xl py-8 space-y-8">
            {/* Greeting */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                  Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">How are you feeling today?</p>
              </div>
              <Button onClick={() => navigate("/checkin")} className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" /> New Check-In
              </Button>
            </div>

            {/* Level & XP Progress */}
            <LevelProgress />

            {/* Weekly Challenges */}
            <WeeklyChallenges />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Check-Ins", value: checkIns.length, icon: <Heart className="w-4 h-4 text-rose-500" />, color: "bg-rose-50" },
                { label: "Avg. Intensity", value: avgIntensity, icon: <TrendingUp className="w-4 h-4 text-violet-500" />, color: "bg-violet-50" },
                { label: "Most Felt", value: mostFrequentEmotion ?? "\u2014", icon: <Brain className="w-4 h-4 text-amber-500" />, color: "bg-amber-50" },
                { label: "Mirror Sessions", value: mirrorSessions.length, icon: <Award className="w-4 h-4 text-green-500" />, color: "bg-green-50" },
                { label: "Current Streak", value: streak ? `${streak.currentStreak}\ud83d\udd25` : "0", icon: <span className="text-base">\ud83d\udd25</span>, color: "bg-orange-50" },
              ].map((stat) => (
                <Card key={stat.label} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Achievements Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {achievements.map((a) => (
                      <div key={a.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
                        <span className="text-base">{a.achievementEmoji}</span>
                        <span className="text-xs font-semibold text-amber-800">{a.achievementTitle}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions (Mobile) */}
            <div className="flex gap-3 sm:hidden">
              <Button className="flex-1" onClick={() => navigate("/checkin")}>
                <Heart className="w-4 h-4 mr-2" /> Check-In
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/compass")}>
                <Sparkles className="w-4 h-4 mr-2" /> Compass
              </Button>
            </div>

            {/* Emotion Distribution Chart */}
            {showSkeleton ? (
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-600" /> Emotion Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChartSkeleton size={140} />
                </CardContent>
              </Card>
            ) : checkIns.length > 2 && (() => {
              const emotionCounts = checkIns.reduce((acc, c) => ({ ...acc, [c.emotion]: (acc[c.emotion] ?? 0) + 1 }), {} as Record<string, number>);
              const pieData = Object.entries(emotionCounts).map(([name, value]) => ({ name, value }));
              // Brand palette for pie chart
              const COLORS = ["#4338CA","#F97316","#0D9488","#F59E0B","#E11D48","#818CF8","#10B981","#FB923C","#6366F1","#9CA3AF"];
              return (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4 text-indigo-600" /> Emotion Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(val, name) => [`${val} check-in${Number(val) > 1 ? 's' : ''}`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 grid grid-cols-2 gap-1.5">
                        {pieData.slice(0, 8).map((entry, i) => (
                          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-muted-foreground truncate">{entry.name}</span>
                            <span className="font-semibold text-foreground ml-auto">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>              );
            })()}

            {/* Intensity Trend Chart */}
            {showSkeleton ? (
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Emotional Intensity — Last 14 Days
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AreaChartSkeleton height={200} />
                </CardContent>
              </Card>
            ) : chartData.length > 1 && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Emotional Intensity — Last 14 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.52 0.15 290)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.52 0.15 290)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.03 260)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[1, 10]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.90 0.03 260)", fontSize: "12px" }}
                        formatter={(val, _, props) => [`${val}/10 — ${props.payload.emotion}`, "Intensity"]}
                      />
                      <Area type="monotone" dataKey="intensity" stroke="oklch(0.52 0.15 290)" fill="url(#intensityGrad)" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent Check-Ins */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Recent Check-Ins
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/checkin")}>
                    <Plus className="w-4 h-4 mr-1" /> New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {checkIns.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="text-4xl">💭</div>
                    <p className="text-muted-foreground text-sm">No check-ins yet. Start your first one!</p>
                    <Button size="sm" onClick={() => navigate("/checkin")}>Begin Check-In</Button>
                  </div>
                ) : (
                  checkIns.slice(0, 8).map((ci) => (
                    <button
                      key={ci.id}
                      onClick={() => navigate(`/checkin/result/${ci.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-2xl flex-shrink-0">{ci.emotionEmoji ?? "💭"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{ci.emotion}</span>
                          <Badge variant="outline" className="text-xs">{ci.intensity}/10</Badge>
                          <Badge variant="secondary" className="text-xs">{ci.context}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(ci.createdAt), "MMM d, yyyy · h:mm a")}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Self Trust Compass Sessions */}
            {mirrorSessions.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Self Trust Compass Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mirrorSessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                      <span className="text-2xl">🪞</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Journey Completed</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(s.completedAt!), "MMM d, yyyy")}</p>
                      </div>
                      {s.badgesEarned && (
                        <div className="flex gap-1 flex-wrap justify-end">
                          {(s.badgesEarned as string[]).slice(0, 3).map((b, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{b}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Emotion Distribution (new component) */}
            <EmotionDistributionChart days={30} />

            {/* Check-In Activity Heatmap */}
            <CheckInActivityChart days={30} />

            {/* Personalized Recommendations */}
            <PersonalizedRecommendations />

            {/* Mood Trend Chart — 30 / 90 days */}
            <MoodTrendChart />

            {/* EI Quiz Widget */}
            <Card className="border shadow-sm bg-gradient-to-br from-violet-50 to-amber-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center text-white text-xl">
                      🧠
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">EI Quiz</h3>
                      <p className="text-xs text-muted-foreground">Measure your 5 EI pillars · ~8 min</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate("/ei-quiz")}
                    className="bg-gradient-to-r from-violet-600 to-amber-500 text-white hover:from-violet-700 hover:to-amber-600 rounded-full px-5"
                  >
                    Take Quiz <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* EI Quiz History */}
            {quizHistory && quizHistory.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4 text-violet-500" /> EI Quiz History
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/ei-quiz")}>
                      <Plus className="w-4 h-4 mr-1" /> Retake
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quizHistory.slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="flex items-center gap-3 p-3 rounded-xl bg-violet-50/50 border border-violet-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {attempt.totalScore}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{attempt.level}</span>
                          <Badge variant="outline" className="text-xs border-violet-200 text-violet-700">{attempt.totalScore}%</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(attempt.createdAt), "MMM d, yyyy · h:mm a")}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Wellness Logbook + CSV Export + Ask for Help */}
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" className="flex-1 sm:flex-none gap-2" onClick={() => navigate("/wellness-logbook")}>
                <BookOpen className="w-4 h-4" /> Wellness Logbook
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-none gap-2" onClick={handleExportCSV} disabled={isExporting}>
                <Download className={`w-4 h-4 ${isExporting ? "animate-spin" : ""}`} /> {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none gap-2"
                style={{ borderColor: "oklch(0.85 0.06 25)", color: "oklch(0.50 0.22 25)" }}
                onClick={() => navigate("/support-options")}
              >
                <Heart className="w-4 h-4" /> Ask for Help
              </Button>
            </div>

            {/* CTA for Seven Mirrors */}
            {mirrorSessions.length === 0 && (
              <div className="rounded-2xl p-6 hc-gradient-hero border border-white/60 text-center space-y-3">
                <div className="text-4xl">🪞</div>
                <h3 className="font-serif text-xl font-bold text-foreground">Ready for a deeper journey?</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">The Self Trust Compass is a guided introspective journey across 7 dimensions of your inner world.</p>
                <Button onClick={() => navigate("/compass")}>
                  <Sparkles className="w-4 h-4 mr-2" /> Begin the Compass
                </Button>
              </div>
            )}
      </div>
      <Footer />
    </div>
  );
}
