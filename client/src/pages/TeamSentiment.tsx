import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart,
} from "recharts";
import { Activity, Download, TrendingUp, Users, Zap } from "lucide-react";

// ─── Brand palette ────────────────────────────────────────────────────────────
const EMOTION_COLORS: Record<string, string> = {
  Happy: "#F59E0B",
  Calm: "#0D9488",
  Sad: "#4338CA",
  Anxious: "#F97316",
  Frustrated: "#E11D48",
  Excited: "#8B5CF6",
  Overwhelmed: "#6366F1",
  Grateful: "#10B981",
  Angry: "#DC2626",
  Hopeful: "#06B6D4",
};
const DEFAULT_COLORS = ["#4338CA", "#F97316", "#0D9488", "#F59E0B", "#E11D48", "#8B5CF6"];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(data: { date: string; avgIntensity: number; count: number }[], filename: string) {
  const header = "Date,Avg Intensity,Check-ins\n";
  const rows = data.map((r) => `${r.date},${r.avgIntensity},${r.count}`).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeamSentiment() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);

  const { data, isLoading } = trpc.business.getTeamSentiment.useQuery(
    { days },
    { enabled: !!user }
  );

  const barData = useMemo(
    () => (data?.topEmotions ?? []).map((e, i) => ({
      emotion: e.emotion,
      count: e.count,
      fill: EMOTION_COLORS[e.emotion] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    })),
    [data]
  );

  const handleExport = () => {
    if (!data?.trendData?.length) {
      toast.error("No data to export");
      return;
    }
    exportCSV(data.trendData, `team-sentiment-${days}d.csv`);
    toast.success(`CSV exported: team-sentiment-${days}d.csv`);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />
      <div className="container max-w-5xl py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Team Sentiment</h1>
              <p className="text-sm text-muted-foreground">Aggregate emotional wellness analytics for your team.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Time range selector */}
            {[7, 14, 30, 60, 90].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "default" : "outline"}
                onClick={() => setDays(d)}
                className={days === d ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
              >
                {d}d
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-5">
                  <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Avg Emotional Intensity"
              value={`${data?.avgIntensity ?? 0}/10`}
              icon={Zap}
              color="bg-indigo-500"
            />
            <StatCard
              label={`Total Check-ins (${days}d)`}
              value={data?.totalCheckIns ?? 0}
              icon={Users}
              color="bg-teal-500"
            />
            <StatCard
              label="Top Emotion"
              value={data?.topEmotions?.[0]?.emotion ?? "—"}
              icon={TrendingUp}
              color="bg-amber-500"
            />
          </div>
        )}

        {/* Top Emotions Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Emotions Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 bg-muted/30 rounded animate-pulse" />
            ) : !barData.length ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No check-in data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="emotion" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="count" name="Check-ins" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <rect key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Daily Trend Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Intensity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 bg-muted/30 rounded animate-pulse" />
            ) : !data?.trendData?.length ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No trend data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.trendData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4338CA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4338CA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)} // MM-DD
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(value: number) => [`${value}/10`, "Avg Intensity"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgIntensity"
                    stroke="#4338CA"
                    strokeWidth={2}
                    fill="url(#intensityGrad)"
                    dot={{ fill: "#4338CA", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Emotions Legend */}
        {!isLoading && (data?.topEmotions?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Emotion Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data!.topEmotions.map((e, i) => (
                  <Badge
                    key={e.emotion}
                    variant="secondary"
                    style={{ backgroundColor: (EMOTION_COLORS[e.emotion] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]) + "22", color: EMOTION_COLORS[e.emotion] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
                    className="text-sm font-medium"
                  >
                    {e.emotion} · {e.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
