import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-emerald-500" };
  return { score, label: "Very Strong", color: "bg-green-600" };
}

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetMutation = trpc.auth.resetPassword.useMutation();
  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
    else setError("Invalid or missing reset token. Please request a new reset link.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (strength.score < 2) {
      setError("Please choose a stronger password.");
      return;
    }
    try {
      await resetMutation.mutateAsync({ token, newPassword: password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed.";
      setError(msg.replace("TRPCClientError: ", ""));
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.03_285)] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/3 w-56 h-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.22 285), transparent)" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}>
                HC
              </div>
              <span className="text-2xl font-black text-[oklch(0.18_0.04_260)]">HeadCheck</span>
            </div>
          </Link>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-6 px-6">
            <h1 className="text-2xl font-bold text-[oklch(0.18_0.04_260)] text-center">Set new password</h1>
            <p className="text-sm text-[oklch(0.55_0.04_260)] text-center">
              Choose a strong password for your account
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {success ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Password updated!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your password has been reset successfully. You can now sign in with your new password.
                  </p>
                </div>
                <Button
                  className="w-full rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      {error}{" "}
                      {error.includes("expired") || error.includes("Invalid") ? (
                        <Link href="/forgot-password" className="underline font-medium">Request a new link</Link>
                      ) : null}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-muted"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strength: <span className="font-medium">{strength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-9 pr-10 ${!passwordsMatch ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      required
                      autoComplete="new-password"
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!passwordsMatch && confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
                  disabled={resetMutation.isPending || !token}
                >
                  {resetMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…</>
                  ) : "Update Password"}
                </Button>

                <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                  Back to sign in
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
