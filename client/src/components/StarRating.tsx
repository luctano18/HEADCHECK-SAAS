/**
 * StarRating
 * Interactive 1-5 star rating widget for resources.
 * - Shows 5 stars with hover preview
 * - Submits via trpc.resources.rate mutation
 * - Displays average rating + vote count after submission
 * - Allows changing a previously submitted rating
 */
import { useState } from "react";
import { Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  resourceId: string;
  /** Pre-fetched stats (average, count, userRating) — passed from parent to avoid N+1 queries */
  initialAverage?: number;
  initialCount?: number;
  initialUserRating?: number | null;
  className?: string;
}

export default function StarRating({
  resourceId,
  initialAverage = 0,
  initialCount = 0,
  initialUserRating = null,
  className,
}: StarRatingProps) {
  const { user } = useAuth();
  const [hovered, setHovered] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<number | null>(initialUserRating);
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);

  const utils = trpc.useUtils();
  const rateMutation = trpc.resources.rate.useMutation({
    onSuccess: (_, variables) => {
      const newRating = variables.rating;
      // Optimistic update of displayed stats
      const prevRating = submitted;
      if (prevRating === null) {
        // New vote
        const newCount = count + 1;
        const newAverage = (average * count + newRating) / newCount;
        setCount(newCount);
        setAverage(Math.round(newAverage * 10) / 10);
      } else {
        // Updated vote
        const newAverage = (average * count - prevRating + newRating) / count;
        setAverage(Math.round(newAverage * 10) / 10);
      }
      setSubmitted(newRating);
      toast.success(prevRating ? "Rating updated!" : "Thanks for your rating!");
      utils.resources.getRatingStats.invalidate({ resourceId });
    },
    onError: () => {
      toast.error("Could not save rating. Please try again.");
    },
  });

  const handleClick = (star: number) => {
    if (!user) {
      toast.info("Please sign in to rate resources.");
      return;
    }
    rateMutation.mutate({ resourceId, rating: star });
  };

  const displayRating = hovered ?? submitted ?? 0;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Stars row */}
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={rateMutation.isPending}
            onMouseEnter={() => setHovered(star)}
            onClick={() => handleClick(star)}
            className={cn(
              "transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded",
              !user && "cursor-default"
            )}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "w-4 h-4 transition-colors",
                star <= displayRating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        ))}

        {/* Pending spinner */}
        {rateMutation.isPending && (
          <span className="ml-1 text-xs text-muted-foreground animate-pulse">Saving…</span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {count > 0 ? (
          <>
            <span className="font-semibold text-amber-600">{average.toFixed(1)}</span>
            <span>/ 5</span>
            <span className="text-muted-foreground/60">·</span>
            <span>{count} {count === 1 ? "rating" : "ratings"}</span>
          </>
        ) : (
          <span className="italic">No ratings yet — be the first!</span>
        )}
        {submitted && (
          <>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-indigo-600 font-medium">Your rating: {submitted}★</span>
          </>
        )}
      </div>
    </div>
  );
}
