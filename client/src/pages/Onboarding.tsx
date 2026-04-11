import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Brain, User, GraduationCap, Building2, ArrowRight, Loader2 } from "lucide-react";

type Role = "student" | "facilitator" | "admin";

const ROLES = [
  { value: "student" as Role, icon: <GraduationCap className="w-6 h-6" />, title: "Student / Individual", desc: "I want to track my emotional wellness and grow personally." },
  { value: "facilitator" as Role, icon: <User className="w-6 h-6" />, title: "Facilitator / Counselor", desc: "I support students or clients and want to monitor cohort wellness." },
  { value: "admin" as Role, icon: <Building2 className="w-6 h-6" />, title: "School Administrator", desc: "I want to set up HeadCheck AI for my institution." },
];

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [step, setStep] = useState<"role" | "details">("role");

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

  const handleContinue = () => {
    if (!selectedRole) return;
    if (selectedRole === "admin") {
      setStep("details");
    } else {
      completeMutation.mutate({ role: selectedRole });
    }
  };

  const handleComplete = () => {
    if (!selectedRole) return;
    completeMutation.mutate({ role: selectedRole, institutionName: institutionName || undefined });
  };

  return (
    <div className="min-h-screen hc-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground">Let's set up your HeadCheck AI experience.</p>
        </div>

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
              onClick={handleContinue}
            >
              {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Set up your institution</h2>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution / School Name</Label>
                  <Input
                    id="institution"
                    placeholder="e.g., Lincoln High School"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep("role")}>Back</Button>
              <Button
                className="flex-1 h-12 text-base"
                disabled={!institutionName.trim() || completeMutation.isPending}
                onClick={handleComplete}
              >
                {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Institution <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
