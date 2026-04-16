import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  EI_PILLAR_COLORS,
  EI_PILLAR_ICONS,
  EI_PILLAR_LABELS,
  EI_PILLAR_DESCRIPTIONS,
  EI_LEVEL_DESCRIPTIONS,
  type EIPillar,
  type EILevel,
} from "@shared/eiQuizData";
import { getLoginUrl } from "@/const";

type QuizResult = {
  scores: {
    selfAwareness: number;
    selfRegulation: number;
    motivation: number;
    empathy: number;
    socialSkills: number;
    total: number;
  };
  level: EILevel;
  aiInsight: string;
  answers: Record<string, number>;
};

const PILLAR_SCORE_MAP: { pillar: EIPillar; key: keyof QuizResult["scores"]; label: string }[] = [
  { pillar: "self-awareness", key: "selfAwareness", label: "Self-Awareness" },
  { pillar: "self-regulation", key: "selfRegulation", label: "Self-Regulation" },
  { pillar: "motivation", key: "motivation", label: "Motivation" },
  { pillar: "empathy", key: "empathy", label: "Empathy" },
  { pillar: "social-skills", key: "socialSkills", label: "Social Skills" },
];

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <span className="text-xl font-bold text-slate-900">{score}%</span>
    </div>
  );
}

function PillarCard({
  pillar,
  score,
  rank,
}: {
  pillar: EIPillar;
  score: number;
  rank: "strongest" | "growth" | "normal";
}) {
  const color = EI_PILLAR_COLORS[pillar];
  const icon = EI_PILLAR_ICONS[pillar];
  const label = EI_PILLAR_LABELS[pillar];
  const description = EI_PILLAR_DESCRIPTIONS[pillar];

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-md ${
        rank === "strongest"
          ? "ring-2 ring-violet-400 bg-violet-50/50"
          : rank === "growth"
          ? "ring-2 ring-amber-300 bg-amber-50/30"
          : "bg-white"
      }`}
    >
      {rank === "strongest" && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-violet-600 text-white text-xs">Strongest</Badge>
        </div>
      )}
      {rank === "growth" && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-amber-500 text-white text-xs">Growth Area</Badge>
        </div>
      )}
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-4">
          <ScoreRing score={score} color={color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{icon}</span>
              <h3 className="font-semibold text-slate-900">{label}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            {/* Score bar */}
            <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${score}%`, backgroundColor: color }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EIQuizResult() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [radarData, setRadarData] = useState<{ subject: string; score: number; fullMark: number }[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("headcheck_quiz_result");
    if (!stored) {
      navigate("/ei-quiz");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as QuizResult;
      setResult(parsed);

      setRadarData([
        { subject: "Self-Awareness", score: parsed.scores.selfAwareness, fullMark: 100 },
        { subject: "Self-Regulation", score: parsed.scores.selfRegulation, fullMark: 100 },
        { subject: "Motivation", score: parsed.scores.motivation, fullMark: 100 },
        { subject: "Empathy", score: parsed.scores.empathy, fullMark: 100 },
        { subject: "Social Skills", score: parsed.scores.socialSkills, fullMark: 100 },
      ]);
    } catch {
      navigate("/ei-quiz");
    }
  }, [navigate]);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const levelInfo = EI_LEVEL_DESCRIPTIONS[result.level];

  // Sort pillars by score
  const sortedPillars = [...PILLAR_SCORE_MAP].sort(
    (a, b) => result.scores[b.key] - result.scores[a.key]
  );
  const strongestPillar = sortedPillars[0].pillar;
  const growthPillar = sortedPillars[sortedPillars.length - 1].pillar;

  const handleRetake = () => {
    sessionStorage.removeItem("headcheck_quiz_result");
    navigate("/ei-quiz");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero result card */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 mb-8 text-white shadow-xl"
          style={{
            background: `linear-gradient(135deg, #7C3AED 0%, #4F46E5 40%, #D97706 100%)`,
          }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 bg-white translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Big score */}
              <div className="flex-shrink-0 text-center">
                <div className="text-7xl font-black leading-none mb-1">{result.scores.total}</div>
                <div className="text-white/70 text-sm font-medium">Overall EI Score</div>
              </div>

              <div className="flex-1">
                <Badge
                  className="mb-3 text-sm px-4 py-1 font-semibold"
                  style={{ backgroundColor: levelInfo.color + "30", color: "white", border: `1px solid ${levelInfo.color}60` }}
                >
                  {result.level} Level
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{levelInfo.headline}</h1>
                <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-lg">
                  {levelInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <Card className="bg-white shadow-sm border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">Your EI Profile</CardTitle>
              <p className="text-sm text-slate-500">Scores across all 5 pillars</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "#94A3B8" }}
                    tickCount={5}
                  />
                  <Radar
                    name="EI Score"
                    dataKey="score"
                    stroke="#7C3AED"
                    fill="#7C3AED"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Score"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* HeadCheck AI Insight */}
          <Card className="bg-gradient-to-br from-slate-900 to-violet-950 text-white shadow-sm border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">✨</span>
                <CardTitle className="text-lg font-semibold text-white">HeadCheck Insight</CardTitle>
              </div>
              <p className="text-white/60 text-xs">Your personalized AI reflection</p>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-white/85 leading-relaxed whitespace-pre-line font-light">
                {result.aiInsight}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40 italic">
                — your HeadCheck companion
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pillar breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Pillar Breakdown</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PILLAR_SCORE_MAP.map(({ pillar, key }) => (
              <PillarCard
                key={pillar}
                pillar={pillar}
                score={result.scores[key]}
                rank={
                  pillar === strongestPillar
                    ? "strongest"
                    : pillar === growthPillar
                    ? "growth"
                    : "normal"
                }
              />
            ))}
          </div>
        </div>

        {/* Guest save nudge */}
        {!user && (
          <Card className="mb-8 bg-gradient-to-r from-violet-50 to-amber-50 border-violet-200">
            <CardContent className="pt-6 pb-5">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Save your EI Profile</h3>
                  <p className="text-sm text-slate-600">
                    Sign in to save your results, track your EI growth over time, and compare with future attempts.
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  className="bg-gradient-to-r from-violet-600 to-amber-500 text-white px-6 rounded-full hover:from-violet-700 hover:to-amber-600 flex-shrink-0"
                >
                  Save My Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleRetake}
            className="px-8 py-3 rounded-full border-violet-300 text-violet-700 hover:bg-violet-50"
          >
            Retake Quiz
          </Button>
          <Button
            onClick={() => navigate("/checkin")}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-violet-600 to-amber-500 text-white hover:from-violet-700 hover:to-amber-600 shadow-md"
          >
            Start a Check-In →
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/learn-ei")}
            className="px-8 py-3 rounded-full border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Learn More About EI
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
