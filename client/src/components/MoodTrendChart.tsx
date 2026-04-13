import { useState, useMemo } from "react";
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
import { TrendingUp, TrendingDown, Minus, Activity, Smile, Zap, Filter } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Days = 30 | 90;

interface TrendPoint {
  date: string;
  avgIntensity: number;
  checkInCount: number;
  dominantEmotion: string;
}

// ─── Emotion colour palette ───────────────────────────────────────────────────
const EMOTION_PALETTE: Record<string, { bg: string; text: string; stroke: string }> = {
  Happy:      { bg: "oklch(0.97 0.07 85)",  text: "oklch(0.45 0.18 85)",  stroke: "oklch(0.65 0.18 85)"  },
  Calm:       { bg: "oklch(0.96 0.05 200)", text: "oklch(0.40 0.14 200)", stroke: "oklch(0.55 0.14 200)" },
  Grateful:   { bg: "oklch(0.96 0.06 155)", text: "oklch(0.40 0.16 155)", stroke: "oklch(0.55 0.16 155)" },
  Motivated:  { bg: "oklch(0.96 0.07 130)", text: "oklch(0.40 0.18 130)", stroke: "oklch(0.55 0.18 130)" },
  Anxious:    { bg: "oklch(0.97 0.07 55)",  text: "oklch(0.45 0.18 55)",  stroke: "oklch(0.65 0.18 55)"  },
  Sad:        { bg: "oklch(0.96 0.05 260)", text: "oklch(0.40 0.14 260)", stroke: "oklch(0.55 0.14 260)" },
  Frustrated: { bg: "oklch(0.97 0.07 30)",  text: "oklch(0.45 0.18 30)",  stroke: "oklch(0.65 0.18 30)"  },
  Angry:      { bg: "oklch(0.97 0.08 20)",  text: "oklch(0.45 0.22 20)",  stroke: "oklch(0.60 0.22 20)"  },
  Exhausted:  { bg: "oklch(0.96 0.05 290)", text: "oklch(0.40 0.14 290)", stroke: "oklch(0.55 0.14 290)" },
  Numb:       { bg: "oklch(0.96 0.02 260)", text: "oklch(0.45 0.04 260)", stroke: "oklch(0.60 0.04 260)" },
  Confused:   { bg: "oklch(0.96 0.06 270)", text: "oklch(0.40 0.16 270)", stroke: "oklch(0.55 0.16 270)" },
  Vulnerable: { bg: "oklch(0.97 0.06 340)", text: "oklch(0.45 0.18 340)", stroke: "oklch(0.65 0.18 340)" },
};

const DEFAULT_PALETTE = { bg: "oklch(0.96 0.04 285)", text: "oklch(0.45 0.14 285)", stroke: "oklch(0.55 0.18 285)" };

function emotionStyle(emotion: string) {
  return EMOTION_PALETTE[emotion] ?? DEFAULT_PALETTE;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(dateStr: string, days: Days): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: TrendPoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const style = emotionStyle(point.dominantEmotion);
  return (
    <div
      className="rounded-xl shadow-lg px-3 py-2.5 text-sm border bg-white"
      style={{ borderColor: "oklch(0.92 0.03 260)" }}
    >
      <p className="font-semibold mb-1" style={{ color: "oklch(0.25 0.04 260)" }}>
        {label}
      </p>
      <p style={{ color: style.stroke }}>
        Intensité : <span className="font-bold">{point.avgIntensity}/10</span>
      </p>
      <p className="text-muted-foreground">
        {point.checkInCount} check-in{point.checkInCount > 1 ? "s" : ""}
      </p>
      <span
        className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
        style={{ background: style.bg, color: style.text }}
      >
        {point.dominantEmotion}
      </span>
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
    <div
      className="flex items-start gap-3 p-3 rounded-xl bg-white border"
      style={{ borderColor: "oklch(0.92 0.03 260)" }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-bold" style={{ color: "oklch(0.25 0.04 260)" }}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Emotion Chip ─────────────────────────────────────────────────────────────
function EmotionChip({
  emotion,
  count,
  selected,
  onClick,
}: {
  emotion: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  const style = emotionStyle(emotion);
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border"
      style={{
        background: selected ? style.stroke : style.bg,
        color: selected ? "white" : style.text,
        borderColor: selected ? style.stroke : "transparent",
        boxShadow: selected ? `0 2px 8px ${style.stroke}44` : "none",
      }}
    >
      {emotion}
      <span
        className="rounded-full px-1 text-[10px] font-bold"
        style={{
          background: selected ? "rgba(255,255,255,0.25)" : style.stroke + "22",
          color: selected ? "white" : style.stroke,
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ days, filtered }: { days: Days; filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "oklch(0.95 0.04 285)" }}
      >
        <Activity className="w-8 h-8" style={{ color: "oklch(0.55 0.18 285)" }} />
      </div>
      <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.35 0.04 260)" }}>
        {filtered
          ? "Aucun check-in pour cette émotion sur cette période"
          : `Pas encore de données sur ${days} jours`}
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        {filtered
          ? "Essayez une autre émotion ou élargissez la période."
          : "Faites au moins 3 check-ins pour voir votre courbe d'humeur apparaître ici."}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MoodTrendChart() {
  const [days, setDays] = useState<Days>(30);
  const [selectedEmotion, setSelectedEmotion] = useState<string | undefined>(undefined);

  // Fetch available emotions for the current period
  const { data: availableEmotions } = trpc.dashboard.getAvailableEmotions.useQuery({ days });

  // Fetch trend and stats — re-runs when days or selectedEmotion changes
  const { data: trend, isLoading: trendLoading } = trpc.dashboard.getMoodTrend.useQuery({
    days,
    emotion: selectedEmotion,
  });
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getMoodStats.useQuery({
    days,
    emotion: selectedEmotion,
  });

  const isLoading = trendLoading || statsLoading;

  // Prepare chart data
  const chartData = useMemo(
    () =>
      (trend ?? []).map((p) => ({
        ...p,
        label: fmtDate(p.date, days),
      })),
    [trend, days]
  );

  // Active stroke colour
  const activeStroke = selectedEmotion
    ? (emotionStyle(selectedEmotion).stroke)
    : "oklch(0.55 0.18 285)";

  // Trend icon
  const TrendIcon =
    stats?.trend === "up" ? TrendingUp : stats?.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    stats?.trend === "up"
      ? "oklch(0.55 0.18 155)"
      : stats?.trend === "down"
      ? "oklch(0.55 0.22 25)"
      : "oklch(0.55 0.04 260)";
  const trendLabel =
    stats?.trend === "up" ? "En hausse" : stats?.trend === "down" ? "En baisse" : "Stable";

  const tickInterval = days === 90 ? Math.max(1, Math.floor(chartData.length / 12)) - 1 : 0;

  // Handle period change — reset emotion filter
  function handleDaysChange(d: Days) {
    setDays(d);
    setSelectedEmotion(undefined);
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "oklch(0.92 0.03 260)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-5 pt-5 pb-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: "oklch(0.97 0.02 285)" }}
      >
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "oklch(0.25 0.04 260)" }}>
            Suivi de l'humeur
            {selectedEmotion && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: emotionStyle(selectedEmotion).bg,
                  color: emotionStyle(selectedEmotion).text,
                }}
              >
                {selectedEmotion}
              </span>
            )}
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
              onClick={() => handleDaysChange(d)}
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
        {/* ── Emotion filter chips ── */}
        {(availableEmotions?.length ?? 0) > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Filter className="w-3 h-3" /> Filtrer :
            </span>
            {/* "Toutes" chip */}
            <button
              onClick={() => setSelectedEmotion(undefined)}
              aria-pressed={selectedEmotion === undefined}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 border"
              style={{
                background: selectedEmotion === undefined ? "oklch(0.55 0.18 285)" : "oklch(0.96 0.04 285)",
                color: selectedEmotion === undefined ? "white" : "oklch(0.45 0.14 285)",
                borderColor: selectedEmotion === undefined ? "oklch(0.55 0.18 285)" : "transparent",
                boxShadow: selectedEmotion === undefined ? "0 2px 8px oklch(0.55 0.18 285 / 0.3)" : "none",
              }}
            >
              Toutes
            </button>
            {availableEmotions?.map(({ emotion, count }) => (
              <EmotionChip
                key={emotion}
                emotion={emotion}
                count={count}
                selected={selectedEmotion === emotion}
                onClick={() =>
                  setSelectedEmotion(selectedEmotion === emotion ? undefined : emotion)
                }
              />
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 py-4 mt-4">
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ) : !chartData.length ? (
          <EmptyState days={days} filtered={!!selectedEmotion} />
        ) : (
          <>
            {/* ── Area Chart ── */}
            <div className="mt-4 mb-5" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeStroke} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={activeStroke} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.92 0.03 260)"
                    vertical={false}
                  />
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
                  <ReferenceLine
                    y={5}
                    stroke="oklch(0.75 0.04 260)"
                    strokeDasharray="4 4"
                    label={{
                      value: "Neutre",
                      position: "insideTopRight",
                      fontSize: 9,
                      fill: "oklch(0.65 0.04 260)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgIntensity"
                    stroke={activeStroke}
                    strokeWidth={2.5}
                    fill="url(#moodGrad)"
                    dot={{
                      r: chartData.length <= 15 ? 3 : 0,
                      fill: activeStroke,
                      strokeWidth: 0,
                    }}
                    activeDot={{ r: 5, fill: activeStroke, stroke: "white", strokeWidth: 2 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Stats row ── */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={Activity}
                  label="Intensité moyenne"
                  value={`${stats.avgIntensity}/10`}
                  color={activeStroke}
                />
                <StatCard
                  icon={TrendIcon}
                  label="Tendance"
                  value={trendLabel}
                  color={trendColor}
                />
                <StatCard
                  icon={Smile}
                  label={selectedEmotion ? "Émotion filtrée" : "Émotion dominante"}
                  value={selectedEmotion ?? stats.topEmotion}
                  sub={`${stats.totalCheckIns} check-in${stats.totalCheckIns > 1 ? "s" : ""}`}
                  color={emotionStyle(selectedEmotion ?? stats.topEmotion).stroke}
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
