import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Brain, ArrowRight, ArrowLeft, Loader2, AlertTriangle, Phone, Heart, Sparkles, Wind, Eye, Smile } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EMOTIONS = [
  { emoji: "😌", label: "Calm", color: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100" },
  { emoji: "😊", label: "Happy", color: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100" },
  { emoji: "🌟", label: "Grateful", color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" },
  { emoji: "😔", label: "Sad", color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
  { emoji: "😰", label: "Anxious", color: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" },
  { emoji: "😤", label: "Frustrated", color: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" },
  { emoji: "😡", label: "Angry", color: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" },
  { emoji: "😴", label: "Exhausted", color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" },
  { emoji: "😶", label: "Numb", color: "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100" },
  { emoji: "🤔", label: "Confused", color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" },
  { emoji: "💪", label: "Motivated", color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" },
  { emoji: "🥺", label: "Vulnerable", color: "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100" },
  { emoji: "🌈", label: "Hopeful", color: "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100" },
  { emoji: "💫", label: "Inspired", color: "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100" },
  { emoji: "🔋", label: "Disconnected", color: "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100" },
  { emoji: "⚡", label: "Overwhelmed", color: "bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100" },
];

const STRESSORS = [
  { id: "school", label: "School or learning pressure", emoji: "📚" },
  { id: "work", label: "Work or activism burnout", emoji: "💼" },
  { id: "family", label: "Family or relationship tension", emoji: "🏠" },
  { id: "financial", label: "Financial stress", emoji: "💸" },
  { id: "decision", label: "Decision fatigue", emoji: "🤯" },
  { id: "conflict", label: "Conflict with others", emoji: "⚡" },
  { id: "uncertainty", label: "Uncertainty about next steps", emoji: "🧭" },
  { id: "communication", label: "Communication and boundaries", emoji: "💬" },
];

const NEEDS = [
  {
    id: "reflection",
    label: "A moment of reflection",
    description: "Place your hand on your heart. Notice what you're feeling without trying to change it. You're allowed to feel exactly as you do right now.",
    emoji: "🪞",
  },
  {
    id: "breathing",
    label: "A breathing pause",
    description: "Progress doesn't have to be linear. Sometimes the most courageous thing you can do is pause and rest. You're doing better than you think.",
    emoji: "🌬️",
  },
  {
    id: "voice",
    label: "A reminder about your voice",
    description: "It's okay to say no. It's okay to take up space. Your needs and feelings are valid, and you have the right to express them.",
    emoji: "🎙️",
  },
  {
    id: "compassion",
    label: "Self-compassion",
    description: "You deserve compassion, especially from yourself. The care you give to others? You deserve that too.",
    emoji: "💗",
  },
];

const GROUNDING_PRACTICES = [
  {
    id: "breath",
    title: "4-4-6 Breath Pattern",
    description: "Breathe in for 4 counts, hold for 4, exhale for 6. Repeat 3 times.",
    instruction: "Breathe in slowly for 4 counts, hold for 4, and exhale for 6. Your breath is an anchor you can always return to.",
    icon: Wind,
    color: "from-sky-50 to-blue-50 border-sky-200",
    iconColor: "text-sky-500",
  },
  {
    id: "bodyscan",
    title: "Body Scan",
    description: "Close your eyes. Scan from head to toe, noticing any tension or sensations without judgment.",
    instruction: "Notice sensations — Close your eyes. Scan from head to toe, noticing any tension or sensations without judgment.",
    icon: Eye,
    color: "from-violet-50 to-purple-50 border-violet-200",
    iconColor: "text-violet-500",
  },
  {
    id: "compassion",
    title: "Self-Compassion Practice",
    description: "Say aloud or in your mind: 'I am doing my best with what I have right now. That is enough.'",
    instruction: "Say aloud or in your mind: 'I am doing my best with what I have right now. That is enough.'",
    icon: Smile,
    color: "from-rose-50 to-pink-50 border-rose-200",
    iconColor: "text-rose-500",
  },
];

const CONTEXTS = [
  { value: "School" as const, emoji: "🏫", label: "School" },
  { value: "Family" as const, emoji: "🏠", label: "Family" },
  { value: "Relationships" as const, emoji: "💞", label: "Relationships" },
  { value: "Work" as const, emoji: "💼", label: "Work" },
  { value: "Self" as const, emoji: "🪞", label: "Self" },
];

type GuestAiResult = {
  emotionalReflection: string;
  brainInsight: string;
  eiPillar: string;
  eiPillarDescription: string;
  aieiProverb: string;
  aieiProverbOrigin: string;
  personalizedNextStep: string;
  supportInvitation: string;
};

export default function CheckIn() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Step 1: emotions, Step 2: stressors, Step 3: needs, Step 4: grounding, Step 5: journal+submit
  const [step, setStep] = useState(1);
  const [selectedEmotions, setSelectedEmotions] = useState<typeof EMOTIONS[number][]>([]);
  const [selectedStressors, setSelectedStressors] = useState<string[]>([]);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [selectedGrounding, setSelectedGrounding] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<typeof CONTEXTS[0] | null>(null);
  const [journal, setJournal] = useState("");
  const [crisisDialogOpen, setCrisisDialogOpen] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<string | null>(null);

  const crisisQuery = trpc.checkIns.detectCrisisRealtime.useQuery(
    { text: journal, intensity: 5 },
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
      navigate(`/checkin/result/${data.checkInId}`);
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const guestCreateMutation = trpc.checkIns.guestCreate.useMutation({
    onSuccess: (data) => {
      navigate("/checkin/guest-result", { state: { result: data } });
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const handleToggleEmotion = (emotion: typeof EMOTIONS[number]) => {
    setSelectedEmotions(prev =>
      prev.some(e => e.label === emotion.label)
        ? prev.filter(e => e.label !== emotion.label)
        : [...prev, emotion]
    );
  };

  const handleToggleStressor = (id: string) => {
    setSelectedStressors(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleToggleNeed = (id: string) => {
    setSelectedNeeds(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!selectedEmotions.length || !selectedContext) return;
    const primaryEmotion = selectedEmotions[0];
    const journalWithContext = [
      journal,
      selectedStressors.length ? `Stressors: ${selectedStressors.join(", ")}` : "",
      selectedNeeds.length ? `Needs: ${selectedNeeds.join(", ")}` : "",
      selectedGrounding ? `Grounding practice chosen: ${selectedGrounding}` : "",
    ].filter(Boolean).join("\n\n");

    if (isAuthenticated) {
      createMutation.mutate({
        emotion: primaryEmotion.label,
        emotionEmoji: primaryEmotion.emoji,
        intensity: 5,
        context: selectedContext.value,
        journalEntry: journalWithContext,
      });
    } else {
      guestCreateMutation.mutate({
        emotion: primaryEmotion.label,
        emotionEmoji: primaryEmotion.emoji,
        intensity: 5,
        context: selectedContext.value,
        journalEntry: journalWithContext,
      });
    }
  };

  const isLoading = createMutation.isPending || guestCreateMutation.isPending;
  const totalSteps = 5;

  const stepTitles = [
    "How are you feeling right now?",
    "What is weighing on you right now?",
    "What do you need most right now?",
    "Choose a grounding practice to center yourself",
    "Add context & reflect",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 pt-20 pb-16 px-4">
      {/* Crisis Dialog */}
      <Dialog open={crisisDialogOpen} onOpenChange={setCrisisDialogOpen}>
        <DialogContent className="max-w-md border-red-200 bg-red-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              You're Not Alone
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-red-800">
              {crisisSeverity === "critical"
                ? "We noticed you may be in significant distress. Your wellbeing matters deeply."
                : "It sounds like you're going through something really difficult right now."}
            </p>
            <div className="bg-white rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-700">988 Suicide & Crisis Lifeline</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Call or text <strong>988</strong> — free, confidential, 24/7</p>
              <a href="tel:988" className="block w-full text-center bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                Call 988 Now
              </a>
            </div>
            <p className="text-xs text-gray-500 text-center">
              HeadCheck AI is a wellness tool, not a substitute for professional mental health care.
            </p>
            <Button variant="outline" onClick={() => setCrisisDialogOpen(false)} className="w-full">
              Continue Check-In
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200 shadow-sm mb-4">
            <Heart className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Emotional Check-In</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Take a moment to pause and reflect</h1>
          <p className="text-gray-500 text-sm">Select all that apply</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-amber-100">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{stepTitles[step - 1]}</h2>

          {/* Step 1: Emotion Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EMOTIONS.map((emotion) => {
                  const isSelected = selectedEmotions.some(e => e.label === emotion.label);
                  return (
                    <button
                      key={emotion.label}
                      onClick={() => handleToggleEmotion(emotion)}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                        isSelected
                          ? "border-amber-400 bg-amber-50 shadow-md scale-105"
                          : `${emotion.color} border`
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <span className="text-2xl">{emotion.emoji}</span>
                      <span className="text-xs font-medium">{emotion.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedEmotions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedEmotions.map(e => (
                    <Badge key={e.label} className="bg-amber-100 text-amber-700 border-amber-200">
                      {e.emoji} {e.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Stressors */}
          {step === 2 && (
            <div className="space-y-3">
              {STRESSORS.map((stressor) => {
                const isSelected = selectedStressors.includes(stressor.id);
                return (
                  <button
                    key={stressor.id}
                    onClick={() => handleToggleStressor(stressor.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-amber-400 bg-amber-50 shadow-sm"
                        : "border-gray-100 bg-gray-50 hover:border-amber-200 hover:bg-amber-50/50"
                    }`}
                  >
                    <span className="text-xl">{stressor.emoji}</span>
                    <span className={`text-sm font-medium ${isSelected ? "text-amber-800" : "text-gray-700"}`}>
                      {stressor.label}
                    </span>
                    {isSelected && <span className="ml-auto text-amber-500">✓</span>}
                  </button>
                );
              })}
              <p className="text-xs text-gray-400 text-center pt-2">You can skip this step if nothing applies</p>
            </div>
          )}

          {/* Step 3: Needs */}
          {step === 3 && (
            <div className="space-y-3">
              {NEEDS.map((need) => {
                const isSelected = selectedNeeds.includes(need.id);
                return (
                  <button
                    key={need.id}
                    onClick={() => handleToggleNeed(need.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-amber-400 bg-amber-50 shadow-sm"
                        : "border-gray-100 bg-gray-50 hover:border-amber-200 hover:bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">{need.emoji}</span>
                      <span className={`font-medium text-sm ${isSelected ? "text-amber-800" : "text-gray-700"}`}>
                        {need.label}
                      </span>
                      {isSelected && <span className="ml-auto text-amber-500">✓</span>}
                    </div>
                    <p className="text-xs text-gray-500 pl-8 leading-relaxed">{need.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 4: Grounding Practice */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Remember: You don't have to carry everything alone. Support exists, even when it's not immediately visible.
              </p>
              <div className="grid gap-4">
                {GROUNDING_PRACTICES.map((practice) => {
                  const Icon = practice.icon;
                  const isSelected = selectedGrounding === practice.id;
                  return (
                    <button
                      key={practice.id}
                      onClick={() => setSelectedGrounding(isSelected ? null : practice.id)}
                      className={`w-full text-left p-5 rounded-2xl border-2 bg-gradient-to-br transition-all duration-200 ${
                        isSelected
                          ? "border-amber-400 shadow-md scale-[1.01]"
                          : `${practice.color} hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-xl bg-white/70 ${practice.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-800 text-sm">{practice.title}</h3>
                            {isSelected && <span className="text-amber-500 text-sm">✓ Selected</span>}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{practice.description}</p>
                          {isSelected && (
                            <div className="mt-3 p-3 bg-white/60 rounded-xl border border-amber-200">
                              <p className="text-xs text-amber-800 italic leading-relaxed">"{practice.instruction}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Context + Journal */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">What area of life is this connected to?</label>
                <div className="grid grid-cols-5 gap-2">
                  {CONTEXTS.map((ctx) => (
                    <button
                      key={ctx.value}
                      onClick={() => setSelectedContext(ctx)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all duration-200 ${
                        selectedContext?.value === ctx.value
                          ? "border-amber-400 bg-amber-50 shadow-sm"
                          : "border-gray-100 bg-gray-50 hover:border-amber-200"
                      }`}
                    >
                      <span className="text-2xl">{ctx.emoji}</span>
                      <span className="text-xs font-medium text-gray-600">{ctx.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Describe how you're feeling... <span className="text-gray-400 font-normal">(optional)</span></label>
                <Textarea
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="Share what's on your mind. This is your safe space..."
                  className="min-h-[120px] resize-none rounded-2xl border-amber-100 bg-amber-50/30 focus:border-amber-300 focus:ring-amber-200"
                />
                {crisisQuery.data?.detected && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>We noticed some distress signals. Please reach out if you need support.</span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <p className="text-xs font-medium text-amber-700 mb-2">Your check-in summary:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmotions.map(e => (
                    <Badge key={e.label} className="bg-white text-amber-700 border-amber-200 text-xs">{e.emoji} {e.label}</Badge>
                  ))}
                  {selectedContext && (
                    <Badge className="bg-white text-orange-700 border-orange-200 text-xs">{selectedContext.emoji} {selectedContext.label}</Badge>
                  )}
                  {selectedGrounding && (
                    <Badge className="bg-white text-sky-700 border-sky-200 text-xs">
                      🌬️ {GROUNDING_PRACTICES.find(g => g.id === selectedGrounding)?.title}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-amber-100">
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && selectedEmotions.length === 0}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl px-6"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedEmotions.length || !selectedContext}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl px-6"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating insights...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Get My Insights</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-6 max-w-md mx-auto leading-relaxed">
          HeadCheck AI is a wellness support tool, not a substitute for professional mental health care.
          If you're in crisis, please call or text <strong>988</strong> (Suicide & Crisis Lifeline).
        </p>
      </div>
    </div>
  );
}
