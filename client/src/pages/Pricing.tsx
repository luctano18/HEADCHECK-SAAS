import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: plans } = trpc.billing.getPlans.useQuery();
  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => {
      toast.error(err.message);
      setLoadingPlan(null);
    },
  });

  const handleSubscribe = (priceId: string, planId: string) => {
    if (!priceId) {
      toast.info("This plan is not yet available for purchase.");
      return;
    }
    setLoadingPlan(planId);
    createCheckout.mutate({
      priceId,
      successUrl: `${window.location.origin}/dashboard?subscribed=true`,
      cancelUrl: `${window.location.origin}/pricing`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container max-w-6xl py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Choose the plan that fits your emotional wellness journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col border-2 transition-all hover:shadow-lg ${
                plan.id === "pro" ? "border-primary scale-[1.02]" : "border-border"
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span>{plan.name}</span>
                  <span className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className="p-6 pt-0">
                <Button
                  className="w-full h-12 text-base"
                  variant={plan.id === "pro" ? "default" : "outline"}
                  disabled={plan.price === 0 || loadingPlan === plan.id}
                  onClick={() => handleSubscribe(plan.stripePriceId, plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : plan.price === 0 ? (
                    "Get Started Free"
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>
      <Footer />
    </div>
  );
}