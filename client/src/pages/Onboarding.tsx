import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Brain, User, GraduationCap, Building2, ArrowRight, Loader2,
  Target, Bell, PlayCircle, CheckCircle
} from "lucide-react";

type Role = "student" | "facilitator" | "admin";
type OnboardingStep = "role" | "goal" | "notifications" | "firstStep" | "done";

const ROLES = [
  { value: "student" as Role, icon: <GraduationCap className="w-6 h-6" />, title: "Student / Individual", desc: "I want to track my emotional wellness and grow personally." },
  { value: "facilitator" as Role, icon: <User className="w-6 h-6" />, title: "Facilitator / Counselor", desc: "I support students or clients and want to monitor cohort wellness." },
  { value: "admin" as Role, icon: <Building2 className="w-6 h-6" />, title: "School Administrator", desc: "I want to set up HeadCheck AI for my institution." },
];

const GOALS = [
  { value: "self-awareness", label: "Better understand my emotions", emoji: "🧠" },
  { value: "reduce-stress", label: "Reduce stress and anxiety", emoji: "🌿" },
  { value: "build-habits", label: "Build a daily emotional wellness habit", emoji: "🔥" },
  { value: "support-others", label: "Support students or clients better", emoji: "🤝" },
  { value: "team-wellness", label: "Improve team/organization wellness", emoji: "🏢" },
];

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<OnboardingStep>("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");

  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      toast.success("Welcome to HeadCheck AI!");
      if (selectedRole === "admin" || selectedRole === "facilitator") {
        navigate("/facilitator");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const updateReminderMutation = trpc.profile.updateReminderSettings.useMutation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleRoleContinue = () => {
    if (!selectedRole) return;
    setStep("goal");
  };

  const handleGoalContinue = () => {
    if (!selectedGoal) return;
    setStep("notifications");
  };

  const handleNotificationsContinue = async () => {
    if (enableReminders) {
      await updateReminderMutation.mutateAsync({
        reminderEnabled: true,
        reminderTime,
        reminderDays: "1,2,3,4,5",
      });
    }
    setStep("firstStep");
  };

  const handleFirstStepContinue = () => {
    setStep("done");
  };

  const handleComplete = () => {
    if (!selectedRole) return;

    if (selectedRole === "admin" && institutionName) {
      completeMutation.mutate({ role: selectedRole, institutionName });
    } else {
      completeMutation.mutate({ role: selectedRole });
    }
  };

  const progress = {
    role: 20,
    goal: 40,
    notifications: 60,
    firstStep: 80,
    done: 100,
  }[step];

  return (
    <div className="min-h-screen hc-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground">Let's set up your HeadCheck AI experience.</p>

          {/* Progress Bar */}
          <div className="mt-6 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Step {["role", "goal", "notifications", "firstStep", "done"].indexOf(step) + 1}/5</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* STEP 1: Role Selection */}
        {step === "role" && (
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground mb-6">I am a...</p>
            {ROLES.map((r) => (
              <Card
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  selectedRole === r.value
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selectedRole === r.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {r.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{r.title}</p>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              className="w-full h-12 text-base mt-6"
              disabled={!selectedRole || completeMutation.isPending}
              onClick={handleRoleContinue}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Goal Selection */}
        {step === "goal" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Target className="w-10 h-10 mx-auto text-primary mb-3" />
              <h2 className="text-xl font-semibold">What brings you here?</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose your main goal</p>
            </div>

            <div className="space-y-3">
              {GOALS.map((g) => (
                <Card
                  key={g.value}
                  onClick={() => setSelectedGoal(g.value)}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedGoal === g.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="text-3xl">{g.emoji}</span>
                    <p className="font-medium text-foreground">{g.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep("role")}>Back</Button>
              <Button className="flex-1 h-12" disabled={!selectedGoal} onClick={handleGoalContinue}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Notifications */}
        {step === "notifications" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Bell className="w-10 h-10 mx-auto text-primary mb-3" />
              <h2 className="text-xl font-semibold">Stay consistent</h2>
              <p className="text-sm text-muted-foreground mt-1">Enable daily reminders?</p>
            </div>

            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Daily Check-in Reminders</p>
                    <p className="text-sm text-muted-foreground">Get a gentle nudge each morning</p>
                  </div>
                  <Button
                    variant={enableReminders ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnableReminders(!enableReminders)}
                  >
                    {enableReminders ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                {enableReminders && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="time">Reminder time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep("goal")}>Back</Button>
              <Button className="flex-1 h-12" onClick={handleNotificationsContinue}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: First Step Teaser */}
        {step === "firstStep" && (
          <div className="space-y-6 text-center">
            <div>
              <PlayCircle className="w-14 h-14 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-semibold">Ready for your first step?</h2>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                The best way to start is with a quick emotional check-in. It takes less than 2 minutes.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                size="lg"
                className="h-14 text-base"
                onClick={() => navigate("/checkin")}
              >
                <PlayCircle className="w-5 h-5 mr-2" /> Start My First Check-In
              </Button>
              <Button variant="ghost" onClick={handleFirstStepContinue}>
                I'll do it later
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Done */}
        {step === "done" && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold">You're all set!</h2>
              <p className="text-muted-foreground mt-2">Your journey to emotional clarity starts now.</p>
            </div>

            <Button size="lg" className="h-14 px-10 text-base" onClick={handleComplete}>
              Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}