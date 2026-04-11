import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Brain, ArrowRight, ArrowLeft, Loader2, AlertTriangle, Phone, X, Heart
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EMOTIONS = [
  { emoji: "😌", label: "Calm", color: "bg-sky-50 border-sky-200 text-sky-700" },
  { emoji: "😊", label: "Happy", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  { emoji: "🌟", label: "Grateful", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { emoji: "😔", label: "Sad", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { emoji: "😰", label: "Anxious", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { emoji: "😤", label: "Frustrated", color: "bg-red-50 border-red-200 text-red-700" },
  { emoji: "😡", label: "Angry", color: "bg-rose-50 border-rose-200 text-rose-700" },
  { emoji: "😴", label: "Exhausted", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { emoji: "😶", label: "Numb", color: "bg-gray-50 border-gray-200 text-gray-600" },
  { emoji: "🤔", label: "Confused", color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  { emoji: "💪", label: "Motivated", color: "bg-green-50 border-green-200 text-green-700" },
  { emoji: "🥺", label: "Vulnerable", color: "bg-pink-50 border-pink-200 text-pink-700" },
];

const CONTEXTS = [
  { value: "School" as const, emoji: "🏫", label: "School" },
  { value: "Family" as const, emoji: "🏠", label: "Family" },
  { value: "Relationships" as const, emoji: "💞", label: "Relationships" },
  { value: "Work" as const, emoji: "💼", label: "Work" },
  { value: "Self" as const, emoji: "🪞", label: "Self" },
];

const INTENSITY_LABELS: Record<number, string> = {
  1: "Barely noticeable", 2: "Very mild", 3: "Mild", 4: "Moderate",
  5: "Noticeable", 6: "Strong", 7: "Quite intense", 8: "Very intense",
  9: "Overwhelming", 10: "Unbearable",
};

export default function CheckIn() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedEmotion, setSelectedEmotion] = useState<typeof EMOTIONS[0] | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [selectedContext, setSelectedContext] = useState<typeof CONTEXTS[0] | null>(null);
  const [journal, setJournal] = useState("");
  const [crisisDialogOpen, setCrisisDialogOpen] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<string | null>(null);

  const crisisQuery = trpc.checkIns.detectCrisisRealtime.useQuery(
    { text: journal, intensity },
    { enabled: journal.length > 10, refetchInterval: false }
  );

  useEffect(() => {
    if (crisisQuery.data?.detected && !crisisDialogOpen) {
      setCrisisSeverity(crisisQuery.data.severity);
      setCrisisDialogOpen(true);
    }
  }, [crisisQuery.data?.detected]);

  const createMutation = trpc.checkIns.create.useMutation({
    onSuccess: (data) => {
      if (data.crisisDetected) {
        setCrisisSeverity(data.severity);
        setCrisisDialogOpen(true);
      }
      navigate(`/check-in/${data.checkInId}`);
    },
    onError: (err) => toast.error("Something went wrong. Please try again."),
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleSubmit = () => {
    if (!selectedEmotion || !selectedContext) return;
    createMutation.mutate({
      emotion: selectedEmotion.label,
      emotionEmoji: selectedEmotion.emoji,
      intensity,
      context: selectedContext.value,
      journalEntry: journal || undefined,
    });
  };

  const canProceed = step === 1 ? !!selectedEmotion : step === 2 ? true : step === 3 ? !!selectedContext : true;

  return (
    <div className="min-h-screen bg-background">
      {/* Crisis Dialog */}
      <Dialog open={crisisDialogOpen} onOpenChange={setCrisisDialogOpen}>
        <DialogContent className="max-w-md border-2 border-destructive/30 bg-red-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              We're here for you
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground leading-relaxed">
              We noticed some signs that you might be going through something really difficult right now. You don't have to face this alone.
            </p>
            <div className="bg-white rounded-xl p-4 border border-destructive/20 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">Immediate Support Available 24/7</p>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-destructive">
                <Phone className="w-6 h-6" />
                988
              </div>
              <p className="text-xs text-muted-foreground mt-1">Suicide & Crisis Lifeline — Call or Text</p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              You can also continue your check-in. Your response will be handled with care.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" onClick={() => window.open("tel:988")}>
                <Phone className="w-4 h-4 mr-2" /> Call 988 Now
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setCrisisDialogOpen(false)}>
                Continue Check-In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">HeadCheck AI</span>
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/50" : "w-4 bg-muted"}`} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium">Step {step} of 4</span>
        </div>
      </div>

      <div className="container max-w-2xl py-12">
        {/* Step 1: Emotion */}
        {step === 1 && (
          <div className="animate-fade-in-up space-y-8">
            <div className="text-center">
              <Badge variant="secondary" className="mb-3">Emotional Check-In</Badge>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">How are you feeling right now?</h1>
              <p className="text-muted-foreground">Select the emotion that best describes your current state.</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {EMOTIONS.map((e) => (
                <button
                  key={e.label}
                  onClick={() => setSelectedEmotion(e)}
                  className={`emotion-card flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    selectedEmotion?.label === e.label
                      ? `${e.color} border-current shadow-md selected`
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-3xl">{e.emoji}</span>
                  <span className="text-xs font-medium">{e.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Intensity */}
        {step === 2 && (
          <div className="animate-fade-in-up space-y-8">
            <div className="text-center">
              <Badge variant="secondary" className="mb-3">Emotional Check-In</Badge>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                How intense is your <span className="text-primary italic">{selectedEmotion?.label}</span>?
              </h1>
              <p className="text-muted-foreground">Rate the intensity of your emotion from 1 to 10.</p>
            </div>
            <div className="bg-card rounded-2xl p-8 border shadow-sm space-y-8">
              <div className="text-center">
                <div className="text-7xl mb-2">{selectedEmotion?.emoji}</div>
                <div className="text-5xl font-bold text-primary mb-1">{intensity}</div>
                <div className="text-sm text-muted-foreground font-medium">{INTENSITY_LABELS[intensity]}</div>
              </div>
              <div className="px-4">
                <Slider
                  value={[intensity]}
                  onValueChange={([v]) => setIntensity(v)}
                  min={1} max={10} step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1 — Barely felt</span>
                  <span>10 — Overwhelming</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Context */}
        {step === 3 && (
          <div className="animate-fade-in-up space-y-8">
            <div className="text-center">
              <Badge variant="secondary" className="mb-3">Emotional Check-In</Badge>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">What's the context?</h1>
              <p className="text-muted-foreground">Where is this emotion coming from?</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CONTEXTS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedContext(c)}
                  className={`emotion-card flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                    selectedContext?.value === c.value
                      ? "border-primary bg-primary/5 shadow-md selected"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-4xl">{c.emoji}</span>
                  <span className="text-sm font-semibold">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Journal */}
        {step === 4 && (
          <div className="animate-fade-in-up space-y-8">
            <div className="text-center">
              <Badge variant="secondary" className="mb-3">Emotional Check-In</Badge>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Share more (optional)</h1>
              <p className="text-muted-foreground">Write freely about what's on your mind. This is your private space.</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="text-3xl">{selectedEmotion?.emoji}</div>
                <div>
                  <p className="font-semibold">{selectedEmotion?.label} — Intensity {intensity}/10</p>
                  <p className="text-sm text-muted-foreground">Context: {selectedContext?.label}</p>
                </div>
              </div>
              <Textarea
                placeholder="What's happening? What are you thinking about? There's no right or wrong answer..."
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="min-h-40 resize-none border-0 p-0 focus-visible:ring-0 text-base"
              />
              {journal.length > 10 && crisisQuery.data?.detected && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-red-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>We noticed some concerning signals. If you're in crisis, please call <strong>988</strong>.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button variant="outline" className="h-12 px-6" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              className="flex-1 h-12 text-base"
              disabled={!canProceed}
              onClick={() => setStep(s => s + 1)}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="flex-1 h-12 text-base"
              disabled={createMutation.isPending}
              onClick={handleSubmit}
            >
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating your insights...</>
              ) : (
                <><Heart className="w-4 h-4 mr-2" /> Get My Insights</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
