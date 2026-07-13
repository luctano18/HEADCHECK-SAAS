import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target } from "lucide-react";

export function WeeklyChallenges() {
  const { data: challenges, isLoading } = trpc.dashboard.getWeeklyChallenges.useQuery();

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="h-32 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!challenges || challenges.length === 0) return null;

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-5 h-5 text-orange-500" />
          Weekly Challenges
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {completedCount}/{challenges.length} done
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => {
          const progress = Math.min(Math.floor((challenge.progress / challenge.target) * 100), 100);
          return (
            <div key={challenge.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{challenge.title}</span>
                    {challenge.completed && (
                      <Trophy className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">+{challenge.xpReward} XP</span>
                  <p className="text-[10px] text-muted-foreground">
                    {challenge.progress}/{challenge.target}
                  </p>
                </div>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}