import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loginMutation = trpc.auth.loginEmail.useMutation();
  const utils = trpc.useUtils();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await loginMutation.mutateAsync({ email, password });
      await utils.auth.me.invalidate();
      setSuccess("Signed in successfully! Redirecting…");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setError(msg.replace("TRPCClientError: ", ""));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.97_0.03_285)]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.03_285)] flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.22 285), transparent)" }} />
        <div className="absolute bottom-20 right-1/4 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.18 48), transparent)" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
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
          <p className="text-sm text-[oklch(0.55_0.04_260)] mt-2">Know your mind. Lead your life.</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-6 px-6">
            <h1 className="text-2xl font-bold text-[oklch(0.18_0.04_260)] text-center">Welcome back</h1>
            <p className="text-sm text-[oklch(0.55_0.04_260)] text-center">Sign in to your HeadCheck account</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="oauth">HeadCheck OAuth</TabsTrigger>
              </TabsList>

              {/* ── Email/Password Tab ── */}
              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="py-2 border-green-200 bg-green-50">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-violet-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10"
                        required
                        autoComplete="current-password"
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
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full font-semibold"
                    style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>
                    ) : "Sign In"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-violet-600 font-medium hover:underline">
                      Create one free
                    </Link>
                  </p>
                </form>
              </TabsContent>

              {/* ── OAuth Tab ── */}
              <TabsContent value="oauth">
                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    Sign in with your Manus account using OAuth2. This is the recommended method for users who registered via the Manus platform.
                  </p>
                  <Button
                    onClick={() => { window.location.href = getLoginUrl(); }}
                    className="w-full rounded-full font-semibold"
                    style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
                  >
                    Continue with HeadCheck OAuth
                  </Button>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    <span>Secure OAuth2 + JWT</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center text-muted-foreground">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="font-semibold text-foreground mb-0.5">OAuth2</div>
                      <div>Authorization Code Flow</div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="font-semibold text-foreground mb-0.5">JWT</div>
                      <div>Signed session cookie</div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="font-semibold text-foreground mb-0.5">httpOnly</div>
                      <div>XSS-safe storage</div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    New to HeadCheck?{" "}
                    <Link href="/register" className="text-violet-600 font-medium hover:underline">
                      Create an account
                    </Link>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By signing in, you agree to our{" "}
          <span className="underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
