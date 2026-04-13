import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Minus, Activity, Calendar, Smile, Zap } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Days = 30 | 90;

interface TrendPoint {
  date: string;
  avgIntensity: number;
  checkInCount: number;
  dominantEmotion: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Format a YYYY-MM-DD date to a short label like "Apr 3" */
function fmtDate(dateStr: string, days: Days): string {
  const d = new Date(dateStr + "T00:00:00");
  if (days === 30) {
    return d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
  }
  // For 90 days, show week label every ~7 days
  return d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
}

/** Map intensity 1-10 to a gradient color */
function intensityColor(value: number): string {
  if (value >= 8) return "oklch(0.55 0.22 25)";   // red-ish (high stress)
  if (value >= 6) return "oklch(0.65 0.18 55)";   // amber
  if (value >= 4) return "oklch(0.55 0.18 285)";  // violet (neutral-positive)
  return "oklch(0.55 0.18 155)";                  // green (calm)
}

/** Custom tooltip */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: TrendPoint }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white border rounded-xl shadow-lg px-3 py-2.5 text-sm" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
      <p className="font-semibold mb-1" style={{ color: "oklch(0.25 0.04 260)" }}>{label}</p>
      <p style={{ color: "oklch(0.45 0.18 285)" }}>
        Intensité : <span className="font-bold">{point.avgIntensity}/10</span>
      </p>
      <p className="text-muted-foreground">
        {point.checkInCount} check-in{point.checkInCount > 1 ? "s" : ""}
      </p>
      <p className="text-muted-foreground capitalize">{point.dominantEmotion}</p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white border" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-bold" style={{ color: "oklch(0.25 0.04 260)" }}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ days }: { days: Days }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "oklch(0.95 0.04 285)" }}
      >
        <Activity className="w-8 h-8" style={{ color: "oklch(0.55 0.18 285)" }} />
      </div>
      <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.35 0.04 260)" }}>
        Pas encore de données sur {days} jours
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Faites au moins 3 check-ins pour voir votre courbe d'humeur apparaître ici.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MoodTrendChart() {
  const [days, setDays] = useState<Days>(30);

  const { data: trend, isLoading: trendLoading } = trpc.dashboard.getMoodTrend.useQuery({ days });
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getMoodStats.useQuery({ days });

  const isLoading = trendLoading || statsLoading;

  // Prepare chart data — fill gaps with null for sparse data
  const chartData: (TrendPoint & { label: string })[] =
    (trend ?? []).map((p) => ({
      ...p,
      label: fmtDate(p.date, days),
    }));

  // Trend icon
  const TrendIcon = stats?.trend === "up" ? TrendingUp : stats?.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    stats?.trend === "up"
      ? "oklch(0.55 0.18 155)"
      : stats?.trend === "down"
      ? "oklch(0.55 0.22 25)"
      : "oklch(0.55 0.04 260)";
  const trendLabel =
    stats?.trend === "up" ? "En hausse" : stats?.trend === "down" ? "En baisse" : "Stable";

  // Tick interval for 90-day view
  const tickInterval = days === 90 ? Math.max(1, Math.floor(chartData.length / 12)) - 1 : 0;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "oklch(0.92 0.03 260)" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: "oklch(0.97 0.02 285)" }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: "oklch(0.25 0.04 260)" }}>
            Suivi de l'humeur
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Intensité émotionnelle quotidienne (1–10)
          </p>
        </div>

        {/* Period toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: "oklch(0.92 0.03 260)" }}
          role="group"
          aria-label="Période d'affichage"
        >
          {([30, 90] as Days[]).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: days === d ? "white" : "transparent",
                color: days === d ? "oklch(0.45 0.18 285)" : "oklch(0.50 0.04 260)",
                boxShadow: days === d ? "0 1px 4px oklch(0.45 0.18 285 / 0.15)" : "none",
              }}
              aria-pressed={days === d}
            >
              {d} jours
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5">
        {isLoading ? (
          /* Skeleton */
          <div className="space-y-3 py-4">
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ) : !chartData.length ? (
          <EmptyState days={days} />
        ) : (
          <>
            {/* Area Chart */}
            <div className="mt-4 mb-5" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.18 285)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="oklch(0.55 0.18 285)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.03 260)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "oklch(0.55 0.04 260)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fontSize: 10, fill: "oklch(0.55 0.04 260)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* Reference line at 5 (neutral) */}
                  <ReferenceLine
                    y={5}
                    stroke="oklch(0.75 0.04 260)"
                    strokeDasharray="4 4"
                    label={{ value: "Neutre", position: "insideTopRight", fontSize: 9, fill: "oklch(0.65 0.04 260)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgIntensity"
                    stroke="oklch(0.55 0.18 285)"
                    strokeWidth={2.5}
                    fill="url(#moodGrad)"
                    dot={{ r: chartData.length <= 15 ? 3 : 0, fill: "oklch(0.55 0.18 285)", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "oklch(0.45 0.18 285)", stroke: "white", strokeWidth: 2 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats row */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={Activity}
                  label="Intensité moyenne"
                  value={`${stats.avgIntensity}/10`}
                  color="oklch(0.55 0.18 285)"
                />
                <StatCard
                  icon={TrendIcon}
                  label="Tendance"
                  value={trendLabel}
                  color={trendColor}
                />
                <StatCard
                  icon={Smile}
                  label="Émotion dominante"
                  value={stats.topEmotion}
                  sub={`${stats.totalCheckIns} check-ins`}
                  color="oklch(0.55 0.18 55)"
                />
                <StatCard
                  icon={Zap}
                  label="Pic / Creux"
                  value={`${stats.maxIntensity} / ${stats.minIntensity}`}
                  sub="sur 10"
                  color="oklch(0.55 0.22 25)"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
