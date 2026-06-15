import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  Phone, Heart, MessageCircle, Users, BookOpen,
  ExternalLink, Shield, Sparkles, ArrowRight, Headphones,
} from "lucide-react";

const CRISIS_RESOURCES = [
  {
    icon: <Phone className="w-6 h-6" />,
    title: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support 24/7 for people in distress. Call or text 988.",
    action: "Call 988",
    href: "tel:988",
    color: "bg-red-50 border-red-200",
    iconColor: "text-red-500",
    badgeColor: "bg-red-100 text-red-700",
    badge: "24/7 Crisis",
    urgent: true,
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Crisis Text Line",
    description: "Text HOME to 741741 to connect with a trained crisis counselor via text message.",
    action: "Text HOME to 741741",
    href: "sms:741741?body=HOME",
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-500",
    badgeColor: "bg-orange-100 text-orange-700",
    badge: "Text Support",
    urgent: true,
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "SAMHSA National Helpline",
    description: "Free, confidential, 24/7 treatment referral service for mental health and substance use.",
    action: "Call 1-800-662-4357",
    href: "tel:18006624357",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-500",
    badgeColor: "bg-blue-100 text-blue-700",
    badge: "Mental Health",
    urgent: false,
  },
  {
    icon: <Headphones className="w-6 h-6" />,
    title: "Trans Lifeline",
    description: "Peer support hotline run by and for trans people. Call 877-565-8860.",
    action: "Call 877-565-8860",
    href: "tel:8775658860",
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-500",
    badgeColor: "bg-purple-100 text-purple-700",
    badge: "LGBTQ+",
    urgent: false,
  },
];

const SUPPORT_PATHWAYS = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Emotional Check-In",
    description: "Start with a guided check-in to understand what you're feeling right now.",
    href: "/checkin",
    cta: "Start Check-In",
    color: "from-rose-50 to-pink-50 border-rose-200",
    iconColor: "text-rose-500",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Self Trust Compass",
    description: "Explore your inner world through 7 reflective mirrors designed for self-discovery.",
    href: "/compass",
    cta: "Open Compass",
    color: "from-violet-50 to-purple-50 border-violet-200",
    iconColor: "text-violet-500",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "1-on-1 Coaching",
    description: "Book a private session with a certified emotional intelligence coach.",
    href: "/coaching",
    cta: "Book a Session",
    color: "from-amber-50 to-orange-50 border-amber-200",
    iconColor: "text-amber-500",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Resources Library",
    description: "Curated articles, exercises, and tools to support your emotional wellbeing.",
    href: "/resources",
    cta: "Explore Resources",
    color: "from-teal-50 to-cyan-50 border-teal-200",
    iconColor: "text-teal-500",
  },
];

export default function SupportOptions() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      {/* Hero */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            🤝 You Are Not Alone
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Support Options
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Whether you need immediate crisis support or ongoing emotional guidance,
            we've gathered the right resources for every moment.
          </p>
        </div>
      </section>

      {/* Crisis Resources */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-foreground">Crisis & Emergency Support</h2>
          </div>
          {CRISIS_RESOURCES.map((resource) => (
            <div
              key={resource.title}
              className={`rounded-2xl border p-5 ${resource.color} flex items-start gap-4`}
            >
              <div className={`mt-0.5 ${resource.iconColor} flex-shrink-0`}>
                {resource.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-foreground">{resource.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${resource.badgeColor}`}>
                    {resource.badge}
                  </span>
                  {resource.urgent && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-200 text-red-800">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {resource.description}
                </p>
                <a
                  href={resource.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                >
                  {resource.action} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HeadCheck Pathways */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold text-foreground">HeadCheck Support Pathways</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUPPORT_PATHWAYS.map((pathway) => (
              <div
                key={pathway.title}
                className={`rounded-2xl border bg-gradient-to-br ${pathway.color} p-5 flex flex-col gap-3`}
              >
                <div className={pathway.iconColor}>{pathway.icon}</div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{pathway.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pathway.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start mt-auto"
                  onClick={() => navigate(pathway.href)}
                >
                  {pathway.cta} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ask for Help CTA */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Need to Talk to Someone?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              If you have a facilitator or counselor assigned to you, you can send them a direct message through HeadCheck.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/messages")} className="gap-2">
                <MessageCircle className="w-4 h-4" /> Message My Facilitator
              </Button>
              <Button variant="outline" onClick={() => navigate("/coaching")} className="gap-2">
                <Sparkles className="w-4 h-4" /> Book a Coaching Session
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="px-4 pb-8 text-center">
        <p className="text-xs text-muted-foreground max-w-xl mx-auto">
          HeadCheck AI is an emotional support tool and is <strong>not a substitute</strong> for professional mental health care.
          If you are in immediate danger, please call <strong>911</strong> or go to your nearest emergency room.
        </p>
      </div>

      <Footer />
    </div>
  );
}
