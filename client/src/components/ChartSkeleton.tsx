/**
 * ChartSkeleton — Animated loading placeholders for chart components.
 *
 * Variants:
 *  - "area"   : Area/line chart skeleton (used in MoodTrendChart)
 *  - "bar"    : Bar chart skeleton (used in FacilitatorDashboard)
 *  - "pie"    : Donut/pie chart skeleton (used in Dashboard & FacilitatorDashboard)
 *  - "stat"   : Row of stat cards (used below charts)
 *  - "mini"   : Compact single-line skeleton (used inline)
 *
 * The shimmer effect uses a CSS keyframe defined in index.css via the
 * `animate-shimmer` utility, falling back gracefully to `animate-pulse`.
 */

import { cn } from "@/lib/utils";

// ─── Shimmer base ─────────────────────────────────────────────────────────────
function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "before:animate-[shimmer_1.6s_infinite]",
        className
      )}
      style={style}
    />
  );
}

// ─── Area Chart Skeleton ──────────────────────────────────────────────────────
function AreaChartSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div className="w-full" style={{ height }}>
      {/* Y-axis ticks */}
      <div className="flex h-full gap-2">
        <div className="flex flex-col justify-between py-1 shrink-0">
          {[10, 8, 6, 4, 2, 0].map((v) => (
            <Shimmer key={v} className="w-4 h-2.5 rounded-sm" />
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Horizontal grid lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-muted-foreground/10"
              style={{ top: `${(i / 5) * 100}%` }}
            />
          ))}

          {/* Animated wave bars simulating an area chart */}
          <div className="absolute inset-0 flex items-end gap-[3px] px-1">
            {WAVE_HEIGHTS.map((h, i) => (
              <Shimmer
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 60}ms`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>

      {/* X-axis ticks */}
      <div className="flex justify-between mt-2 pl-6">
        {[...Array(6)].map((_, i) => (
          <Shimmer key={i} className="w-8 h-2.5 rounded-sm" />
        ))}
      </div>
    </div>
  );
}

// Staggered wave heights for a natural area chart silhouette
const WAVE_HEIGHTS = [
  28, 35, 42, 38, 55, 62, 58, 70, 65, 72,
  68, 75, 80, 74, 78, 82, 76, 70, 65, 60,
  55, 62, 58, 52, 48, 44, 50, 46, 40, 36,
];

// ─── Bar Chart Skeleton ───────────────────────────────────────────────────────
function BarChartSkeleton({ height = 180, bars = 7 }: { height?: number; bars?: number }) {
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex h-full gap-2">
        {/* Y-axis */}
        <div className="flex flex-col justify-between py-1 shrink-0">
          {[...Array(5)].map((_, i) => (
            <Shimmer key={i} className="w-4 h-2.5 rounded-sm" />
          ))}
        </div>

        {/* Bars */}
        <div className="flex-1 flex items-end gap-2 pb-0">
          {[...Array(bars)].map((_, i) => {
            const h = BAR_HEIGHTS[i % BAR_HEIGHTS.length];
            return (
              <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: "100%" }}>
                <Shimmer
                  className="w-full rounded-t-md"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 80}ms`,
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 pl-6">
        {[...Array(bars)].map((_, i) => (
          <Shimmer key={i} className="w-6 h-2.5 rounded-sm" />
        ))}
      </div>
    </div>
  );
}

const BAR_HEIGHTS = [45, 65, 55, 80, 70, 50, 60];

// ─── Pie / Donut Chart Skeleton ───────────────────────────────────────────────
function PieChartSkeleton({ size = 140 }: { size?: number }) {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* Donut ring */}
      <div
        className="relative shrink-0 rounded-full"
        style={{ width: size, height: size }}
      >
        {/* Outer ring shimmer */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(oklch(0.88 0.04 270) 0deg 120deg, oklch(0.92 0.02 30) 120deg 200deg, oklch(0.90 0.03 160) 200deg 280deg, oklch(0.88 0.04 270) 280deg 360deg)",
            animation: "pulse 1.8s ease-in-out infinite",
          }}
        />
        {/* Inner hole */}
        <div
          className="absolute rounded-full bg-background"
          style={{
            inset: size * 0.28,
          }}
        />
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ borderRadius: "50%" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
              animation: "shimmer 1.8s infinite",
            }}
          />
        </div>
      </div>

      {/* Legend lines */}
      <div className="flex flex-col gap-2.5 flex-1 min-w-[100px]">
        {[70, 55, 45, 35].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <Shimmer
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
            />
            <Shimmer
              className="h-2.5 rounded-sm"
              style={{
                width: `${w}%`,
                animationDelay: `${i * 100 + 50}ms`,
              } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Cards Row Skeleton ──────────────────────────────────────────────────
function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-xl bg-white border"
          style={{ borderColor: "oklch(0.92 0.04 270)" }}
        >
          <Shimmer
            className="w-8 h-8 rounded-lg shrink-0"
            style={{ animationDelay: `${i * 80}ms` } as React.CSSProperties}
          />
          <div className="flex-1 space-y-2 min-w-0">
            <Shimmer
              className="h-2.5 w-3/4 rounded-sm"
              style={{ animationDelay: `${i * 80 + 40}ms` } as React.CSSProperties}
            />
            <Shimmer
              className="h-4 w-1/2 rounded-sm"
              style={{ animationDelay: `${i * 80 + 80}ms` } as React.CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Card-level Skeleton (header + chart area) ────────────────────────────────
function ChartCardSkeleton({
  variant,
  height,
  bars,
  statCount,
  className,
}: {
  variant: "area" | "bar" | "pie";
  height?: number;
  bars?: number;
  statCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden bg-white",
        className
      )}
      style={{ borderColor: "oklch(0.92 0.04 270)" }}
    >
      {/* Card header */}
      <div
        className="px-5 pt-5 pb-4 flex items-center justify-between gap-3"
        style={{ background: "oklch(0.97 0.03 270)" }}
      >
        <div className="space-y-2">
          <Shimmer className="h-4 w-32 rounded-md" />
          <Shimmer className="h-3 w-48 rounded-md" />
        </div>
        <Shimmer className="h-7 w-28 rounded-xl" />
      </div>

      {/* Chart body */}
      <div className="px-5 pb-5 pt-4">
        {variant === "area" && <AreaChartSkeleton height={height} />}
        {variant === "bar" && <BarChartSkeleton height={height} bars={bars} />}
        {variant === "pie" && <PieChartSkeleton />}
        {statCount && <StatCardsSkeleton count={statCount} />}
      </div>
    </div>
  );
}

// ─── Mini inline skeleton ─────────────────────────────────────────────────────
function MiniChartSkeleton({ height = 180, className }: { height?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn("relative overflow-hidden rounded-xl bg-muted before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:animate-[shimmer_1.6s_infinite]")} style={{ height }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Shimmer key={i} className="h-16 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export {
  ChartCardSkeleton,
  AreaChartSkeleton,
  BarChartSkeleton,
  PieChartSkeleton,
  StatCardsSkeleton,
  MiniChartSkeleton,
  Shimmer,
};
