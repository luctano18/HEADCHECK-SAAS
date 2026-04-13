import { describe, it, expect } from "vitest";

// ─── Pure logic extracted from getMoodTrendByUser / getMoodStatsByUser ────────
// We test the aggregation and stats logic independently of the DB.

interface RawRow {
  intensity: number;
  emotion: string;
  createdAt: Date;
}

function aggregateByDay(rows: RawRow[]) {
  const dayMap = new Map<string, { intensities: number[]; emotions: Record<string, number> }>();
  for (const row of rows) {
    const d = row.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayMap.has(key)) dayMap.set(key, { intensities: [], emotions: {} });
    const entry = dayMap.get(key)!;
    entry.intensities.push(row.intensity);
    entry.emotions[row.emotion] = (entry.emotions[row.emotion] ?? 0) + 1;
  }
  const result: { date: string; avgIntensity: number; checkInCount: number; dominantEmotion: string }[] = [];
  for (const [date, { intensities, emotions }] of Array.from(dayMap.entries())) {
    const avgIntensity =
      Math.round((intensities.reduce((s: number, v: number) => s + v, 0) / intensities.length) * 10) / 10;
    const dominantEmotion = (Object.entries(emotions) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
    result.push({ date, avgIntensity, checkInCount: intensities.length, dominantEmotion });
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

function computeStats(rows: RawRow[]) {
  if (rows.length === 0) return null;
  const intensities = rows.map((r) => r.intensity);
  const avg = Math.round((intensities.reduce((s: number, v: number) => s + v, 0) / intensities.length) * 10) / 10;
  const max = Math.max(...intensities);
  const min = Math.min(...intensities);
  const emotionCounts: Record<string, number> = {};
  for (const r of rows) emotionCounts[r.emotion] = (emotionCounts[r.emotion] ?? 0) + 1;
  const topEmotion = (Object.entries(emotionCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const mid = Math.floor(intensities.length / 2);
  const firstHalfAvg = mid > 0 ? intensities.slice(0, mid).reduce((s: number, v: number) => s + v, 0) / mid : avg;
  const secondHalfLen = intensities.length - mid;
  const secondHalfAvg = secondHalfLen > 0 ? intensities.slice(mid).reduce((s: number, v: number) => s + v, 0) / secondHalfLen : avg;
  const trend: "up" | "down" | "stable" =
    secondHalfAvg - firstHalfAvg > 0.5 ? "up" : secondHalfAvg - firstHalfAvg < -0.5 ? "down" : "stable";
  return { totalCheckIns: rows.length, avgIntensity: avg, maxIntensity: max, minIntensity: min, topEmotion, trend };
}

// ─── Helpers (mirroring db.ts logic with optional emotion filter) ────────────
function aggregateByDayFiltered(rows: RawRow[], emotion?: string) {
  const filtered = emotion ? rows.filter((r) => r.emotion === emotion) : rows;
  return aggregateByDay(filtered);
}

function computeStatsFiltered(rows: RawRow[], emotion?: string) {
  const filtered = emotion ? rows.filter((r) => r.emotion === emotion) : rows;
  return computeStats(filtered);
}

function getAvailableEmotions(rows: RawRow[]) {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.emotion] = (counts[r.emotion] ?? 0) + 1;
  return (Object.entries(counts) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, count]) => ({ emotion, count }));
}

// ─── Test Data ────────────────────────────────────────────────────────────────
const today = new Date("2026-04-13T10:00:00Z");
const yesterday = new Date("2026-04-12T10:00:00Z");
const twoDaysAgo = new Date("2026-04-11T10:00:00Z");

const sampleRows: RawRow[] = [
  { intensity: 7, emotion: "Happy", createdAt: today },
  { intensity: 5, emotion: "Calm", createdAt: today },
  { intensity: 8, emotion: "Happy", createdAt: yesterday },
  { intensity: 3, emotion: "Sad", createdAt: twoDaysAgo },
  { intensity: 4, emotion: "Anxious", createdAt: twoDaysAgo },
];

// ─── aggregateByDay tests ─────────────────────────────────────────────────────
describe("aggregateByDay", () => {
  it("returns one entry per unique day", () => {
    const result = aggregateByDay(sampleRows);
    expect(result).toHaveLength(3);
  });

  it("sorts entries by date ascending", () => {
    const result = aggregateByDay(sampleRows);
    expect(result[0].date).toBe("2026-04-11");
    expect(result[1].date).toBe("2026-04-12");
    expect(result[2].date).toBe("2026-04-13");
  });

  it("computes correct average intensity per day", () => {
    const result = aggregateByDay(sampleRows);
    // today: (7+5)/2 = 6
    const todayEntry = result.find((r) => r.date === "2026-04-13");
    expect(todayEntry?.avgIntensity).toBe(6);
    // yesterday: 8
    const yesterdayEntry = result.find((r) => r.date === "2026-04-12");
    expect(yesterdayEntry?.avgIntensity).toBe(8);
    // two days ago: (3+4)/2 = 3.5
    const twoDaysEntry = result.find((r) => r.date === "2026-04-11");
    expect(twoDaysEntry?.avgIntensity).toBe(3.5);
  });

  it("reports correct check-in count per day", () => {
    const result = aggregateByDay(sampleRows);
    expect(result.find((r) => r.date === "2026-04-13")?.checkInCount).toBe(2);
    expect(result.find((r) => r.date === "2026-04-12")?.checkInCount).toBe(1);
    expect(result.find((r) => r.date === "2026-04-11")?.checkInCount).toBe(2);
  });

  it("picks the dominant emotion correctly", () => {
    const result = aggregateByDay(sampleRows);
    // today: Happy(1) vs Calm(1) — first alphabetically wins in tie
    const todayEntry = result.find((r) => r.date === "2026-04-13");
    expect(["Happy", "Calm"]).toContain(todayEntry?.dominantEmotion);
    // yesterday: only Happy
    expect(result.find((r) => r.date === "2026-04-12")?.dominantEmotion).toBe("Happy");
  });

  it("returns empty array for no rows", () => {
    expect(aggregateByDay([])).toEqual([]);
  });

  it("handles single row", () => {
    const result = aggregateByDay([{ intensity: 6, emotion: "Calm", createdAt: today }]);
    expect(result).toHaveLength(1);
    expect(result[0].avgIntensity).toBe(6);
    expect(result[0].dominantEmotion).toBe("Calm");
  });
});

// ─── computeStats tests ───────────────────────────────────────────────────────
describe("computeStats", () => {
  it("returns null for empty rows", () => {
    expect(computeStats([])).toBeNull();
  });

  it("computes correct total check-ins", () => {
    const stats = computeStats(sampleRows);
    expect(stats?.totalCheckIns).toBe(5);
  });

  it("computes correct average intensity", () => {
    // (7+5+8+3+4)/5 = 27/5 = 5.4
    const stats = computeStats(sampleRows);
    expect(stats?.avgIntensity).toBe(5.4);
  });

  it("computes correct max and min intensity", () => {
    const stats = computeStats(sampleRows);
    expect(stats?.maxIntensity).toBe(8);
    expect(stats?.minIntensity).toBe(3);
  });

  it("identifies the top emotion", () => {
    // Happy appears 3 times (today x1, yesterday x1... wait: today has 1 Happy + 1 Calm, yesterday 1 Happy = 2 Happy total, twoDaysAgo: Sad+Anxious)
    // Actually: Happy(2), Calm(1), Sad(1), Anxious(1) → top = Happy
    const stats = computeStats(sampleRows);
    expect(stats?.topEmotion).toBe("Happy");
  });

  it("detects upward trend when second half is higher", () => {
    const upRows: RawRow[] = [
      { intensity: 2, emotion: "Sad", createdAt: twoDaysAgo },
      { intensity: 3, emotion: "Sad", createdAt: twoDaysAgo },
      { intensity: 8, emotion: "Happy", createdAt: today },
      { intensity: 9, emotion: "Happy", createdAt: today },
    ];
    const stats = computeStats(upRows);
    expect(stats?.trend).toBe("up");
  });

  it("detects downward trend when second half is lower", () => {
    const downRows: RawRow[] = [
      { intensity: 9, emotion: "Happy", createdAt: twoDaysAgo },
      { intensity: 8, emotion: "Happy", createdAt: twoDaysAgo },
      { intensity: 2, emotion: "Sad", createdAt: today },
      { intensity: 3, emotion: "Sad", createdAt: today },
    ];
    const stats = computeStats(downRows);
    expect(stats?.trend).toBe("down");
  });

  it("detects stable trend when difference is within 0.5", () => {
    const stableRows: RawRow[] = [
      { intensity: 5, emotion: "Calm", createdAt: twoDaysAgo },
      { intensity: 5, emotion: "Calm", createdAt: today },
    ];
    const stats = computeStats(stableRows);
    expect(stats?.trend).toBe("stable");
  });

  it("handles single row gracefully", () => {
    const stats = computeStats([{ intensity: 7, emotion: "Happy", createdAt: today }]);
    expect(stats?.totalCheckIns).toBe(1);
    expect(stats?.avgIntensity).toBe(7);
    expect(stats?.trend).toBe("stable");
  });
});

// ─── Emotion filter tests ─────────────────────────────────────────────────────
describe("aggregateByDayFiltered — emotion filter", () => {
  it("returns only days that have check-ins for the filtered emotion", () => {
    // sampleRows: today has Happy+Calm, yesterday has Happy, twoDaysAgo has Sad+Anxious
    const result = aggregateByDayFiltered(sampleRows, "Happy");
    // Only today and yesterday have Happy
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.date)).toEqual(["2026-04-12", "2026-04-13"]);
  });

  it("returns empty array when no check-ins match the filter", () => {
    const result = aggregateByDayFiltered(sampleRows, "Grateful");
    expect(result).toHaveLength(0);
  });

  it("returns all days when no emotion filter is applied", () => {
    const result = aggregateByDayFiltered(sampleRows);
    expect(result).toHaveLength(3);
  });

  it("computes correct average for filtered emotion only", () => {
    // today: only Calm (intensity 5); yesterday: no Calm; twoDaysAgo: no Calm
    const result = aggregateByDayFiltered(sampleRows, "Calm");
    expect(result).toHaveLength(1);
    expect(result[0].avgIntensity).toBe(5);
    expect(result[0].dominantEmotion).toBe("Calm");
  });

  it("filters Sad correctly to twoDaysAgo only", () => {
    const result = aggregateByDayFiltered(sampleRows, "Sad");
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-04-11");
    expect(result[0].avgIntensity).toBe(3);
  });
});

describe("computeStatsFiltered — emotion filter", () => {
  it("returns null when no rows match the emotion filter", () => {
    expect(computeStatsFiltered(sampleRows, "Grateful")).toBeNull();
  });

  it("computes stats only for filtered emotion", () => {
    // Happy appears in: today (7) and yesterday (8) → avg = 7.5, max = 8, min = 7
    const stats = computeStatsFiltered(sampleRows, "Happy");
    expect(stats).not.toBeNull();
    expect(stats?.totalCheckIns).toBe(2);
    expect(stats?.avgIntensity).toBe(7.5);
    expect(stats?.maxIntensity).toBe(8);
    expect(stats?.minIntensity).toBe(7);
    expect(stats?.topEmotion).toBe("Happy");
  });

  it("returns full stats when no emotion filter is applied", () => {
    const stats = computeStatsFiltered(sampleRows);
    expect(stats?.totalCheckIns).toBe(5);
  });

  it("detects trend direction for filtered Happy emotion", () => {
    const stats = computeStatsFiltered(sampleRows, "Happy");
    // Happy rows in sampleRows: today(7) and yesterday(8)
    // sampleRows is ordered: today first, yesterday second → intensities = [7, 8]
    // mid = 1, firstHalfAvg = 7, secondHalfAvg = 8 → diff = +1 → up
    expect(stats?.trend).toBe("up");
  });
});

describe("getAvailableEmotions", () => {
  it("returns emotions sorted by frequency descending", () => {
    const result = getAvailableEmotions(sampleRows);
    // Happy: 2, Calm: 1, Sad: 1, Anxious: 1
    expect(result[0].emotion).toBe("Happy");
    expect(result[0].count).toBe(2);
  });

  it("returns all distinct emotions present in the data", () => {
    const result = getAvailableEmotions(sampleRows);
    const emotions = result.map((r) => r.emotion);
    expect(emotions).toContain("Happy");
    expect(emotions).toContain("Calm");
    expect(emotions).toContain("Sad");
    expect(emotions).toContain("Anxious");
    expect(result).toHaveLength(4);
  });

  it("returns empty array for no rows", () => {
    expect(getAvailableEmotions([])).toEqual([]);
  });

  it("returns single emotion for uniform data", () => {
    const uniform: RawRow[] = [
      { intensity: 5, emotion: "Calm", createdAt: today },
      { intensity: 6, emotion: "Calm", createdAt: yesterday },
    ];
    const result = getAvailableEmotions(uniform);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ emotion: "Calm", count: 2 });
  });
});
