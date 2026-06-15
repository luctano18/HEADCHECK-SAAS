import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { BarChartSkeleton } from "@/components/ChartSkeleton";
import { Activity } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  days?: 30 | 90;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CheckInActivityChart({ days = 30 }: Props) {
  const { data, isLoading } = trpc.dashboard.getCheckInActivity.useQuery({ days });

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Check-In Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartSkeleton height={160} bars={7} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Check-In Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <span className="text-3xl">📅</span>
            <p className="text-sm text-muted-foreground">No activity data yet for the last {days} days.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Aggregate by day of week
  const byDow: Record<number, { count: number; totalIntensity: number }> = {};
  for (let i = 0; i < 7; i++) byDow[i] = { count: 0, totalIntensity: 0 };
  for (const row of data) {
    const dow = parseISO(row.date).getDay();
    byDow[dow].count += row.count;
    byDow[dow].totalIntensity += row.avgIntensity * row.count;
  }
  const chartData = DAY_LABELS.map((label, i) => ({
    day: label,
    count: byDow[i].count,
    avgIntensity: byDow[i].count > 0 ? Math.round((byDow[i].totalIntensity / byDow[i].count) * 10) / 10 : 0,
  }));

  // Recent 14-day timeline for secondary view
  const recentData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((r) => ({
      date: format(parseISO(r.date), "MMM d"),
      count: r.count,
      avgIntensity: r.avgIntensity,
    }));

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Check-In Activity
          <span className="ml-auto text-xs font-normal text-muted-foreground">Last {days} days</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Day-of-week heatmap */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">By day of week</p>
          <div className="flex gap-1.5 items-end h-20">
            {chartData.map((d) => {
              const heightPct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              const opacity = 0.2 + (heightPct / 100) * 0.8;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md transition-all"
                    style={{
                      height: `${Math.max(heightPct, 8)}%`,
                      background: `oklch(0.52 0.15 290 / ${opacity})`,
                      minHeight: "4px",
                    }}
                    title={`${d.day}: ${d.count} check-in${d.count !== 1 ? "s" : ""}${d.avgIntensity > 0 ? `, avg intensity ${d.avgIntensity}` : ""}`}
                  />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent 14-day timeline */}
        {recentData.length > 1 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Recent 14 days</p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={recentData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.03 260)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", fontSize: "12px", border: "1px solid oklch(0.90 0.03 260)" }}
                  formatter={(val: number) => [`${val} check-in${val !== 1 ? "s" : ""}`, "Count"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {recentData.map((_, i) => (
                    <Cell key={i} fill="oklch(0.52 0.15 290)" fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
