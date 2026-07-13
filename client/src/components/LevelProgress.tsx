import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

export function LevelProgress() {
  const { data: levelData, isLoading } = trpc.dashboard.getLevel.useQuery();

  if (isLoading || !levelData) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="h-16 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const { level, xp, xpToNextLevel } = levelData;
  const progress = Math.min(Math.floor((xp / xpToNextLevel) * 100), 100);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-orange-500/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Niveau</p>
              <p className="text-2xl font-bold text-primary">{level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{xp} / {xpToNextLevel} XP</p>
            <p className="text-xs text-muted-foreground">jusqu'au niveau {level + 1}</p>
          </div>
        </div>

        <Progress value={progress} className="h-2" />
        <p className="text-[10px] text-center mt-1.5 text-muted-foreground">
          {progress}% vers le niveau suivant
        </p>
      </CardContent>
    </Card>
  );
}