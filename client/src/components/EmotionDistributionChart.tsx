import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChartSkeleton } from "@/components/ChartSkeleton";
import { PieChart as PieChartIcon } from "lucide-react";

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
const FALLBACK_COLORS = ["#4338CA", "#F97316", "#0D9488", "#F59E0B", "#E11D48", "#6366F1", "#22C55E", "#9CA3AF"];

interface Props {
  days?: 30 | 90;
}

export default function EmotionDistributionChart({ days = 30 }: Props) {
  const { data, isLoading } = trpc.dashboard.getEmotionDistribution.useQuery({ days });

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" /> Emotion Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PieChartSkeleton size={160} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" /> Emotion Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <span className="text-3xl">💭</span>
            <p className="text-sm text-muted-foreground">No check-ins yet in the last {days} days.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const chartData = data.map((d, i) => ({
    ...d,
    color: EMOTION_COLORS[d.emotion] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    pct: Math.round((d.count / total) * 100),
  }));

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-primary" /> Emotion Distribution
          <span className="ml-auto text-xs font-normal text-muted-foreground">Last {days} days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Donut chart */}
          <div className="w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "10px", fontSize: "12px", border: "1px solid oklch(0.90 0.03 260)" }}
                  formatter={(val: number, _: string, props: { payload?: { emotion: string; pct: number } }) => [
                    `${val} check-in${val > 1 ? "s" : ""} (${props.payload?.pct ?? 0}%)`,
                    props.payload?.emotion ?? "",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex-1 grid grid-cols-1 gap-1.5 w-full">
            {chartData.slice(0, 8).map((entry) => (
              <div key={entry.emotion} className="flex items-center gap-2 text-xs">
                <span className="text-base flex-shrink-0">{entry.emoji}</span>
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                  <span className="text-foreground font-medium truncate">{entry.emotion}</span>
                </div>
                <span className="text-muted-foreground font-medium flex-shrink-0">{entry.pct}%</span>
                <span className="text-muted-foreground flex-shrink-0">({entry.count})</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
