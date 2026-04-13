import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the URL.");
      return;
    }
    verifyMutation.mutateAsync({ token })
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Verification failed.";
        setErrorMsg(msg.replace("TRPCClientError: ", ""));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.03_285)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
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
          <CardContent className="px-6 py-8 text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto" />
                <h2 className="text-xl font-bold text-[oklch(0.18_0.04_260)]">Verifying your email…</h2>
                <p className="text-sm text-muted-foreground">Please wait a moment.</p>
              </>
            )}
            {status === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[oklch(0.18_0.04_260)]">Email verified!</h2>
                <p className="text-sm text-muted-foreground">
                  Your email has been verified successfully. Your account is now fully activated.
                </p>
                <Button
                  className="w-full rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              </>
            )}
            {status === "error" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-[oklch(0.18_0.04_260)]">Verification failed</h2>
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full rounded-full font-semibold"
                    style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.72 0.18 48))" }}
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                  <Link href="/login" className="text-sm text-violet-600 hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
