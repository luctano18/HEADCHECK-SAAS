import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Star } from "lucide-react";

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-1 transition-transform hover:scale-110 focus:outline-none"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} out of 5`}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Survey Card ──────────────────────────────────────────────────────────────
function SurveyCard({ survey }: { survey: { id: number; title: string; question: string; isActive: boolean | null } }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const utils = trpc.useUtils();

  const submitMutation = trpc.business.submitResponse.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Response submitted — Thank you for sharing your feedback!");
      utils.business.getActiveSurveys.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Please select a rating before submitting.");
      return;
    }
    submitMutation.mutate({ surveyId: survey.id, rating, comment: comment.trim() || undefined });
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">Response recorded!</p>
          <p className="text-sm text-muted-foreground">Your feedback helps improve team wellness.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-100 dark:border-indigo-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">{survey.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{survey.question}</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-300 shrink-0">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Your rating</p>
          <StarRatingInput value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {["", "Needs improvement", "Below expectations", "Meets expectations", "Good", "Excellent"][rating]}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Comment <span className="text-muted-foreground font-normal">(optional)</span></p>
          <Textarea
            placeholder="Share any additional thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || rating === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Response"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PulseSurveys() {
  const { user } = useAuth();
  const { data: surveys, isLoading } = trpc.business.getActiveSurveys.useQuery(undefined, {
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />
      <div className="container max-w-2xl py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
            <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Pulse Surveys</h1>
            <p className="text-sm text-muted-foreground">Share how you're feeling at work — your responses are anonymous.</p>
          </div>
        </div>

        {/* Surveys */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-8">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !surveys || surveys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No active surveys right now</p>
              <p className="text-sm text-muted-foreground">Check back later — your facilitator will post surveys here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
