import { useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import {
  Brain, Heart, Sparkles, BookOpen, ArrowRight, Loader2, Home,
  Star, Lightbulb, Users, TrendingUp, ThumbsUp, ThumbsDown, CheckCircle2,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import EmotionResourcesPanel from "@/components/EmotionResourcesPanel";
import { useState } from "react";
import { toast } from "sonner";

const RESPONSE_SECTIONS = [
  { key: "emotionalReflection", icon: <Heart className="w-5 h-5" />, title: "Emotional Reflection", color: "bg-rose-50 border-rose-100", iconColor: "text-rose-500", badgeColor: "bg-rose-100 text-rose-700" },
  { key: "brainInsight", icon: <Brain className="w-5 h-5" />, title: "Brain Insight", color: "bg-violet-50 border-violet-100", iconColor: "text-violet-500", badgeColor: "bg-violet-100 text-violet-700" },
  { key: "eiPillar", icon: <Star className="w-5 h-5" />, title: "EI Pillar", color: "bg-amber-50 border-amber-100", iconColor: "text-amber-500", badgeColor: "bg-amber-100 text-amber-700", hasSubtext: true },
  { key: "aieiProverb", icon: <BookOpen className="w-5 h-5" />, title: "African Wisdom (AIEI)", color: "bg-orange-50 border-orange-100", iconColor: "text-orange-500", badgeColor: "bg-orange-100 text-orange-700", isProverb: true },
  { key: "personalizedNextStep", icon: <Lightbulb className="w-5 h-5" />, title: "Your Next Step", color: "bg-green-50 border-green-100", iconColor: "text-green-500", badgeColor: "bg-green-100 text-green-700" },
  { key: "supportInvitation", icon: <Users className="w-5 h-5" />, title: "Support Invitation", color: "bg-sky-50 border-sky-100", iconColor: "text-sky-500", badgeColor: "bg-sky-100 text-sky-700" },
  { key: "affirmation", icon: <Sparkles className="w-5 h-5" />, title: "HeadCheck Affirmation", color: "bg-gradient-to-br from-violet-50 to-pink-50 border-violet-200", iconColor: "text-violet-500", badgeColor: "bg-violet-100 text-violet-700", isAffirmation: true },
];

// ─── Engagement Beacon ──────────────────────────────────────────────────────
function sendEngagementBeacon(checkInId: number, dwellTimeMs: number, behaviorScore: number) {
  try {
    if (typeof navigator.sendBeacon !== "function") return;
    const body = JSON.stringify({ "0": { json: { checkInId, dwellTimeMs, behaviorScore } } });
    navigator.sendBeacon(
      "/api/trpc/checkIns.reportEngagement?batch=1",
      new Blob([body], { type: "application/json" })
    );
  } catch {
    // Best-effort telemetry — never let this block navigation or throw past this function.
  }
}

/** Score for a deliberate "continue the journey" action (New Check-In / Self Trust Compass). */
function scoreOnContinue(dwellMs: number, feedbackGiven: boolean): number {
  if (dwellMs > 8000) return 2;
  return feedbackGiven ? 1 : 0;
}

/** Score for a passive exit (SPA unmount via other navigation, or the tab closing). */
function scoreOnExit(dwellMs: number, feedbackGiven: boolean): number {
  if (dwellMs < 3000 && !feedbackGiven) return -2;
  return feedbackGiven ? 1 : 0;
}

// ─── Feedback Bar ─────────────────────────────────────────────────────────────
function FeedbackBar({ checkInId, onFeedbackGiven }: { checkInId: number; onFeedbackGiven: () => void }) {
  const [selected, setSelected] = useState<"yes" | "somewhat" | "not_yet" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.checkIns.submitFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onFeedbackGiven();
      toast.success("Thank you for your feedback!");
    },
    onError: () => toast.error("Could not save feedback. Please try again."),
  });

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-green-50 border-green-100 p-5 flex items-center gap-3 animate-fade-in-up">
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        <p className="text-sm text-green-700 font-medium">Thank you! Your feedback helps us improve HeadCheck AI.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4 animate-fade-in-up">
      <p className="text-sm font-semibold text-foreground">Did this response feel helpful?</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelected("yes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            selected === "yes"
              ? "bg-green-100 border-green-300 text-green-700"
              : "bg-background border-border text-muted-foreground hover:border-green-300 hover:text-green-600"
          }`}
        >
          <ThumbsUp className="w-4 h-4" /> Yes
        </button>
        <button
          onClick={() => setSelected("somewhat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            selected === "somewhat"
              ? "bg-yellow-100 border-yellow-300 text-yellow-700"
              : "bg-background border-border text-muted-foreground hover:border-yellow-300 hover:text-yellow-600"
          }`}
        >
          <span className="text-base leading-none">🤔</span> Somewhat
        </button>
        <button
          onClick={() => setSelected("not_yet")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            selected === "not_yet"
              ? "bg-red-100 border-red-300 text-red-700"
              : "bg-background border-border text-muted-foreground hover:border-red-300 hover:text-red-600"
          }`}
        >
          <ThumbsDown className="w-4 h-4" /> Not yet
        </button>
      </div>

      {selected && (
        <div className="space-y-3 animate-fade-in-up">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={selected === "yes" ? "What resonated most with you? (optional)" : "What could be improved? (optional)"}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={2}
            maxLength={500}
          />
          <Button
            size="sm"
            onClick={() => submitFeedback.mutate({ checkInId, rating: selected, feedbackText: comment || undefined })}
            disabled={submitFeedback.isPending}
            className="w-full"
          >
            {submitFeedback.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Feedback
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CheckInResult() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const checkInId = parseInt(params.id ?? "0");

  const { data, isLoading, error } = trpc.checkIns.getWithResponse.useQuery(
    { checkInId },
    { enabled: !!checkInId && isAuthenticated }
  );

  const pageEnteredAtRef = useRef(performance.now());
  const feedbackGivenRef = useRef(false);
  const reportSentRef = useRef(false);

  const reportExit = () => {
    if (reportSentRef.current) return;
    reportSentRef.current = true;
    const dwellMs = performance.now() - pageEnteredAtRef.current;
    sendEngagementBeacon(checkInId, dwellMs, scoreOnExit(dwellMs, feedbackGivenRef.current));
  };

  const reportContinue = () => {
    if (reportSentRef.current) return;
    reportSentRef.current = true;
    const dwellMs = performance.now() - pageEnteredAtRef.current;
    sendEngagementBeacon(checkInId, dwellMs, scoreOnContinue(dwellMs, feedbackGivenRef.current));
  };

  useEffect(() => {
    if (!checkInId) return;
    window.addEventListener("pagehide", reportExit);
    return () => {
      window.removeEventListener("pagehide", reportExit);
      reportExit();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInId]);

  if (!isAuthenticated) { navigate("/"); return null; }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg text-foreground">Generating your insights...</p>
          <p className="text-sm text-muted-foreground mt-1">Our AI is crafting your personalized response.</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Could not load your check-in results.</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { checkIn, aiResponse } = data;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">HeadCheck AI</span>
          </button>
          <Badge variant="secondary">Your Insights</Badge>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <Home className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </div>

      <div className="container max-w-2xl py-10 space-y-6">
        {/* Emotion Summary Card */}
        <div className="bg-card rounded-2xl p-6 border shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{checkIn.emotionEmoji}</div>
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold text-foreground">{checkIn.emotion}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline">Intensity: {checkIn.intensity}/10</Badge>
                <Badge variant="outline">{checkIn.context}</Badge>
              </div>
            </div>
          </div>
          {checkIn.journalEntry && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground italic leading-relaxed">"{checkIn.journalEntry}"</p>
            </div>
          )}
        </div>

        {/* AI Response Sections */}
        {aiResponse && (
          <div className="space-y-4">
            {RESPONSE_SECTIONS.map((section, idx) => {
              const value = aiResponse[section.key as keyof typeof aiResponse] as string;
              if (!value) return null;
              return (
                <div
                  key={section.key}
                  className={`rounded-2xl p-5 border ${section.color} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={section.iconColor}>{section.icon}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${section.badgeColor}`}>
                      {section.title}
                    </span>
                  </div>
                  {section.hasSubtext ? (
                    <div>
                      <p className="font-bold text-foreground text-lg mb-1">{value}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{aiResponse.eiPillarDescription}</p>
                    </div>
                  ) : section.isProverb ? (
                    <div>
                      <blockquote className="font-serif text-lg italic text-foreground leading-relaxed border-l-4 border-orange-300 pl-4">
                        "{value}"
                      </blockquote>
                      {aiResponse.aieiProverbOrigin && (
                        <p className="text-xs text-muted-foreground mt-2 pl-4">— {aiResponse.aieiProverbOrigin}</p>
                      )}
                      {typeof (aiResponse as Record<string, unknown>).aieiProverbExplanation === "string" && (
                        <p className="text-sm text-orange-700/80 mt-3 leading-relaxed">{String((aiResponse as Record<string, unknown>).aieiProverbExplanation)}</p>
                      )}
                    </div>
                  ) : section.isAffirmation ? (
                    <div className="text-center py-2">
                      <p className="font-serif text-xl font-semibold text-violet-700 leading-relaxed">✨ {value}</p>
                      <p className="text-xs text-muted-foreground mt-3">— your HeadCheck companion</p>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed">{value}</p>
                  )}
                </div>
              );
            })}

            {/* Pattern Insight — only shown when AI detected a recurring pattern */}
            {aiResponse.patternInsight && (
              <div
                className="rounded-2xl p-5 border bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 animate-fade-in-up"
                style={{ animationDelay: "0.8s" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-teal-500"><TrendingUp className="w-5 h-5" /></span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                    Pattern Insight
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{aiResponse.patternInsight}</p>
                <p className="text-xs text-teal-600 mt-3 font-medium">
                  🔄 Based on your recent check-in history
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contextual Resources for the detected emotion */}
        <EmotionResourcesPanel emotion={checkIn.emotion} />

        {/* Feedback Bar */}
        {aiResponse && <FeedbackBar checkInId={checkInId} onFeedbackGiven={() => { feedbackGivenRef.current = true; }} />}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button variant="outline" className="h-12" onClick={() => { reportContinue(); navigate("/checkin"); }}>
            <Heart className="w-4 h-4 mr-2" /> New Check-In
          </Button>
          <Button className="h-12" onClick={() => { reportContinue(); navigate("/compass"); }}>
            <Sparkles className="w-4 h-4 mr-2" /> Self Trust Compass
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground pb-4">
          HeadCheck AI is an emotional support tool and is not a substitute for professional mental health care.
          If you're in crisis, call <strong>988</strong>.
        </p>
      </div>
    </div>
  );
}
