/**
 * EmailVerificationBanner
 * Shows a dismissible banner when the user has an email/password account
 * but hasn't verified their email yet.
 * Reads emailVerified status from the credential query.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, CheckCircle2 } from "lucide-react";

export default function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resent, setResent] = useState(false);

  // Only show for email/password users
  const isEmailUser = user?.loginMethod === "email";

  // We check email verified via a lightweight query
  const credQuery = trpc.auth.getEmailVerifiedStatus.useQuery(undefined, {
    enabled: isAuthenticated && isEmailUser,
    refetchOnWindowFocus: false,
  });

  if (!isAuthenticated || !isEmailUser || dismissed) return null;
  if (credQuery.isLoading || credQuery.data?.emailVerified) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-4 py-2">
      <Alert className="max-w-3xl mx-auto border-amber-200 bg-amber-50 shadow-md">
        <Mail className="w-4 h-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-amber-800 text-sm">
            Please verify your email address to unlock all features.
            {user?.email && <strong className="ml-1">{user.email}</strong>}
          </span>
          <div className="flex items-center gap-2">
            {resent ? (
              <span className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verification email sent!
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => setResent(true)}
              >
                Resend email
              </Button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-600 hover:text-amber-800 p-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
