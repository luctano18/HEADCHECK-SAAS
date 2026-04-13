import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const forgotMutation = trpc.auth.forgotPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await forgotMutation.mutateAsync({ email });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.replace("TRPCClientError: ", ""));
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.03_285)] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/3 w-56 h-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.22 285), transparent)" }} />
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
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-6 px-6">
            <h1 className="text-2xl font-bold text-[oklch(0.18_0.04_260)] text-center">Reset your password</h1>
            <p className="text-sm text-[oklch(0.55_0.04_260)] text-center">
              Enter your email and we'll send you a reset link
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {submitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Check your inbox</h3>
                  <p className="text-sm text-muted-foreground">
                    If <strong>{email}</strong> is registered, you'll receive a password reset link within a few minutes.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  The link expires in 1 hour. Didn't receive it? Check your spam folder.
                </p>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                >
                  Try a different email
                </Button>
                <Link href="/login" className="block text-sm text-violet-600 hover:underline">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
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

                <Button
                  type="submit"
                  className="w-full rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                  ) : "Send Reset Link"}
                </Button>

                <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
