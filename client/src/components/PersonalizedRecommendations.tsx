import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function PersonalizedRecommendations() {
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.dashboard.getPersonalizedRecommendations.useQuery();

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Only show after 3+ check-ins
  if (!data || data.totalCheckIns < 3 || data.recommendations.length === 0) return null;

  return (
    <Card className="border shadow-sm bg-gradient-to-br from-indigo-50/60 to-coral-50/30 dark:from-indigo-950/30 dark:to-orange-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Personalized for You
          {data.topEmotion && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Based on your recent {data.topEmotion.toLowerCase()} pattern
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {data.recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{rec}</p>
          </div>
        ))}
        <div className="pt-1 flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/checkin")}
            className="text-xs rounded-full"
          >
            New Check-In <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate("/resources")}
            className="text-xs rounded-full"
          >
            Explore Resources
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
