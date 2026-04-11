import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { Brain, CheckCircle2, Loader2, Users } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function JoinInstitution() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");

  const acceptMutation = trpc.institutions.acceptInvitation.useMutation({
    onSuccess: () => {
      toast.success("You've joined the institution successfully!");
      navigate("/dashboard");
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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Invalid invitation link.</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen hc-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-primary/20 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground mb-2">You've been invited!</h1>
              <p className="text-muted-foreground text-sm">Sign in to accept your invitation and join your institution on HeadCheck AI.</p>
            </div>
            <Button className="w-full h-12" onClick={() => window.location.href = getLoginUrl()}>
              Sign In to Accept
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen hc-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-primary/20 shadow-xl animate-fade-in-up">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
            <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Accept Invitation</h1>
            <p className="text-muted-foreground text-sm">
              Welcome, <span className="font-medium text-foreground">{user?.name}</span>! Click below to join your institution and start your HeadCheck AI journey.
            </p>
          </div>
          <Button
            className="w-full h-12 text-base"
            disabled={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate({ token })}
          >
            {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Accept & Join
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Decline</Button>
        </CardContent>
      </Card>
    </div>
  );
}
