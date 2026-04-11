import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Brain, Heart, Sparkles, BookOpen, ArrowRight, Loader2, Home, Star, Lightbulb, Users } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const RESPONSE_SECTIONS = [
  { key: "emotionalReflection", icon: <Heart className="w-5 h-5" />, title: "Emotional Reflection", color: "bg-rose-50 border-rose-100", iconColor: "text-rose-500", badgeColor: "bg-rose-100 text-rose-700" },
  { key: "brainInsight", icon: <Brain className="w-5 h-5" />, title: "Brain Insight", color: "bg-violet-50 border-violet-100", iconColor: "text-violet-500", badgeColor: "bg-violet-100 text-violet-700" },
  { key: "eiPillar", icon: <Star className="w-5 h-5" />, title: "EI Pillar", color: "bg-amber-50 border-amber-100", iconColor: "text-amber-500", badgeColor: "bg-amber-100 text-amber-700", hasSubtext: true },
  { key: "aieiProverb", icon: <BookOpen className="w-5 h-5" />, title: "African Wisdom (AIEI)", color: "bg-orange-50 border-orange-100", iconColor: "text-orange-500", badgeColor: "bg-orange-100 text-orange-700", isProverb: true },
  { key: "personalizedNextStep", icon: <Lightbulb className="w-5 h-5" />, title: "Your Next Step", color: "bg-green-50 border-green-100", iconColor: "text-green-500", badgeColor: "bg-green-100 text-green-700" },
  { key: "supportInvitation", icon: <Users className="w-5 h-5" />, title: "Support Invitation", color: "bg-sky-50 border-sky-100", iconColor: "text-sky-500", badgeColor: "bg-sky-100 text-sky-700" },
  { key: "mochaAffirmation", icon: <Sparkles className="w-5 h-5" />, title: "Mocha's Affirmation", color: "bg-gradient-to-br from-violet-50 to-pink-50 border-violet-200", iconColor: "text-violet-500", badgeColor: "bg-violet-100 text-violet-700", isAffirmation: true },
];

export default function CheckInResult() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const checkInId = parseInt(params.id ?? "0");

  const { data, isLoading, error } = trpc.checkIns.getWithResponse.useQuery(
    { checkInId },
    { enabled: !!checkInId && isAuthenticated }
  );

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
                    </div>
                  ) : section.isAffirmation ? (
                    <div className="text-center py-2">
                      <p className="font-serif text-xl font-semibold text-violet-700 leading-relaxed">✨ {value}</p>
                      <p className="text-xs text-muted-foreground mt-3">— Mocha, your HeadCheck companion</p>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed">{value}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button variant="outline" className="h-12" onClick={() => navigate("/checkin")}>
            <Heart className="w-4 h-4 mr-2" /> New Check-In
          </Button>
          <Button className="h-12" onClick={() => navigate("/compass")}>
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
