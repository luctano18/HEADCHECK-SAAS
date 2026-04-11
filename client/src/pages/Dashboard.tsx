import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Brain, Heart, Sparkles, ArrowRight, Loader2, LogOut, User,
  TrendingUp, Calendar, Award, Plus, ChevronRight
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

const EMOTION_COLORS: Record<string, string> = {
  Happy: "#f59e0b", Calm: "#06b6d4", Grateful: "#10b981", Sad: "#6366f1",
  Anxious: "#f97316", Frustrated: "#ef4444", Angry: "#dc2626", Exhausted: "#8b5cf6",
  Numb: "#9ca3af", Confused: "#6366f1", Motivated: "#22c55e", Vulnerable: "#ec4899",
};

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.dashboard.getHistory.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Brain className="w-10 h-10 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) { navigate("/"); return null; }

  const checkIns = data?.checkIns ?? [];
  const mirrorSessions = data?.mirrorSessions ?? [];

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
      {/* ── Sidebar Layout ── */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border hidden md:flex">
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">HeadCheck <span className="text-sidebar-primary">AI</span></span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {[
              { icon: <TrendingUp className="w-4 h-4" />, label: "Dashboard", path: "/dashboard", active: true },
              { icon: <Heart className="w-4 h-4" />, label: "Emotional Check-In", path: "/check-in" },
              { icon: <Sparkles className="w-4 h-4" />, label: "Seven Mirrors", path: "/seven-mirrors" },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <User className="w-4 h-4 text-sidebar-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email ?? ""}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="md:hidden border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="container flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">HeadCheck AI</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 max-w-5xl">
            {/* Greeting */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                  Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">How are you feeling today?</p>
              </div>
              <Button onClick={() => navigate("/check-in")} className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" /> New Check-In
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Check-Ins", value: checkIns.length, icon: <Heart className="w-4 h-4 text-rose-500" />, color: "bg-rose-50" },
                { label: "Avg. Intensity", value: avgIntensity, icon: <TrendingUp className="w-4 h-4 text-violet-500" />, color: "bg-violet-50" },
                { label: "Most Felt", value: mostFrequentEmotion ?? "—", icon: <Brain className="w-4 h-4 text-amber-500" />, color: "bg-amber-50" },
                { label: "Mirror Sessions", value: mirrorSessions.length, icon: <Award className="w-4 h-4 text-green-500" />, color: "bg-green-50" },
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

            {/* Quick Actions (Mobile) */}
            <div className="flex gap-3 sm:hidden">
              <Button className="flex-1" onClick={() => navigate("/check-in")}>
                <Heart className="w-4 h-4 mr-2" /> Check-In
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/seven-mirrors")}>
                <Sparkles className="w-4 h-4 mr-2" /> Seven Mirrors
              </Button>
            </div>

            {/* Intensity Trend Chart */}
            {chartData.length > 1 && (
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
                  <Button variant="ghost" size="sm" onClick={() => navigate("/check-in")}>
                    <Plus className="w-4 h-4 mr-1" /> New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {checkIns.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="text-4xl">💭</div>
                    <p className="text-muted-foreground text-sm">No check-ins yet. Start your first one!</p>
                    <Button size="sm" onClick={() => navigate("/check-in")}>Begin Check-In</Button>
                  </div>
                ) : (
                  checkIns.slice(0, 8).map((ci) => (
                    <button
                      key={ci.id}
                      onClick={() => navigate(`/check-in/${ci.id}`)}
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

            {/* Seven Mirrors Sessions */}
            {mirrorSessions.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Seven Mirrors Sessions
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

            {/* CTA for Seven Mirrors */}
            {mirrorSessions.length === 0 && (
              <div className="rounded-2xl p-6 hc-gradient-hero border border-white/60 text-center space-y-3">
                <div className="text-4xl">🪞</div>
                <h3 className="font-serif text-xl font-bold text-foreground">Ready for a deeper journey?</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">The Seven Mirrors is a guided introspective experience across 7 dimensions of your inner world.</p>
                <Button onClick={() => navigate("/seven-mirrors")}>
                  <Sparkles className="w-4 h-4 mr-2" /> Begin Seven Mirrors
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
