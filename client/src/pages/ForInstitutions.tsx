import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, ArrowRight, CheckCircle, School, Users, BarChart3, Shield, Bell, Globe } from "lucide-react";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const FEATURES = [
  {
    icon: <BarChart3 className="w-6 h-6 text-violet-600" />,
    bg: "bg-violet-50",
    title: "Cohort Analytics Dashboard",
    description: "Track anonymized emotional trends across your entire student population. Identify patterns, monitor engagement, and understand the emotional climate of your institution — all in one view.",
  },
  {
    icon: <Bell className="w-6 h-6 text-rose-600" />,
    bg: "bg-rose-50",
    title: "Real-Time Crisis Alerts",
    description: "Automatic detection of at-risk students through AI-powered crisis analysis. Facilitators receive immediate, anonymized alerts so they can intervene before situations escalate.",
  },
  {
    icon: <Users className="w-6 h-6 text-blue-600" />,
    bg: "bg-blue-50",
    title: "Group & Cohort Management",
    description: "Create student groups by class, grade, or program. Invite students via secure email links. Monitor engagement at the group level with detailed cohort-specific insights.",
  },
  {
    icon: <Shield className="w-6 h-6 text-green-600" />,
    bg: "bg-green-50",
    title: "Privacy-First Architecture",
    description: "Complete data isolation between institutions. All student data is anonymized in analytics. FERPA-ready infrastructure with role-based access control and encrypted data storage.",
  },
  {
    icon: <Globe className="w-6 h-6 text-amber-600" />,
    bg: "bg-amber-50",
    title: "Culturally Responsive AI",
    description: "HeadCheck AI integrates African-Inspired Emotional Intelligence (AIEI), making it uniquely relevant for diverse student populations. Proverbs, cultural context, and community values are woven into every response.",
  },
  {
    icon: <Brain className="w-6 h-6 text-orange-600" />,
    bg: "bg-orange-50",
    title: "Neuroscience-Backed Curriculum",
    description: "Built on the 5 Pillars of Emotional Intelligence and real neuroscience. Students learn about their brain, emotions, and behavior — not just manage them. The Resources Library and Learn EI module provide structured learning pathways.",
  },
];

const ROLES = [
  {
    emoji: "🎓",
    title: "Students",
    description: "Daily emotional check-ins, AI-powered guidance, Seven Mirrors deep reflection, streak tracking, and achievement badges. A safe, private space to process emotions and build resilience.",
    color: "border-violet-200 bg-violet-50/50",
  },
  {
    emoji: "🧑‍🏫",
    title: "Facilitators & Counselors",
    description: "Aggregated cohort analytics, crisis alerts for at-risk students, group engagement metrics, and tools to identify students who may need additional support — without compromising individual privacy.",
    color: "border-blue-200 bg-blue-50/50",
  },
  {
    emoji: "🏫",
    title: "School Administrators",
    description: "Institution-wide setup, group creation, student invitation management, and high-level engagement reports. Full control over your institution's HeadCheck AI environment.",
    color: "border-amber-200 bg-amber-50/50",
  },
];

const STATS = [
  { value: "6", label: "AI Response Dimensions", sub: "per check-in" },
  { value: "7", label: "Seven Mirrors Themes", sub: "for deep reflection" },
  { value: "100%", label: "Anonymized Analytics", sub: "privacy protected" },
  { value: "24/7", label: "Crisis Detection", sub: "real-time monitoring" },
];

export default function ForInstitutions() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="hc-gradient-bar h-1.5" />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg hc-gradient-orange flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm">HeadCheck AI</span>
            </div>
          </div>
          <Button size="sm" className="hc-gradient-orange border-0 text-white hover:opacity-90" asChild>
            <a href={getLoginUrl()}>Get Started <ArrowRight className="w-4 h-4 ml-1" /></a>
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="hc-gradient-warm py-16">
        <div className="container max-w-4xl text-center space-y-5">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-4 py-1.5">
            <School className="w-3.5 h-3.5 mr-1.5" /> For Schools & Institutions
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Emotional Intelligence<br />
            <span className="text-transparent bg-clip-text hc-gradient-orange">at Scale</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            HeadCheck AI gives schools and mental health centers the tools to support student wellbeing proactively — with real-time crisis detection, cohort analytics, and culturally responsive AI guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" className="hc-gradient-orange border-0 text-white hover:opacity-90 text-base h-12 px-8" asChild>
              <a href={getLoginUrl()}>Set Up Your Institution <ArrowRight className="w-5 h-5 ml-1" /></a>
            </Button>
            <Button size="lg" variant="outline" className="text-base h-12 px-8" onClick={() => navigate("/")}>
              See How It Works
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-y">
        <div className="container max-w-4xl py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label} className="space-y-1">
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container max-w-5xl py-16 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl font-bold text-foreground">Built for Educational Institutions</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Everything your institution needs to support student mental health at scale, with privacy and cultural sensitivity at the core.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border shadow-sm p-6 space-y-3 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role Cards */}
      <div className="bg-muted/30 py-16">
        <div className="container max-w-4xl space-y-10">
          <div className="text-center space-y-3">
            <h2 className="font-serif text-3xl font-bold text-foreground">Designed for Every Role</h2>
            <p className="text-muted-foreground">HeadCheck AI adapts its experience based on who is using it — students, facilitators, and administrators each get the tools they need.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ROLES.map((r) => (
              <div key={r.title} className={`rounded-2xl border-2 ${r.color} p-6 space-y-3`}>
                <div className="text-4xl">{r.emoji}</div>
                <h3 className="font-semibold text-foreground text-lg">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container max-w-3xl py-16 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl font-bold text-foreground">Getting Started is Simple</h2>
          <p className="text-muted-foreground">Set up your institution in minutes. No technical expertise required.</p>
        </div>
        <div className="space-y-4">
          {[
            { step: "01", title: "Create Your Institution Account", desc: "Sign up and select 'Administrator' during onboarding. Name your institution and your account is ready." },
            { step: "02", title: "Create Student Groups", desc: "Organize students into groups by class, grade, or program. Each group gets its own analytics view." },
            { step: "03", title: "Invite Students & Facilitators", desc: "Send secure invitation links via email. Students join with one click and are automatically assigned to your institution." },
            { step: "04", title: "Monitor & Support", desc: "Access your Facilitator Dashboard to view cohort trends, receive crisis alerts, and track engagement in real time." },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 bg-white rounded-2xl border p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl hc-gradient-orange flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{s.step}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="hc-gradient-warm py-16">
        <div className="container max-w-2xl text-center space-y-5">
          <h2 className="font-serif text-3xl font-bold text-foreground">Ready to support your students?</h2>
          <p className="text-muted-foreground">Join the institutions using HeadCheck AI to build emotionally intelligent, resilient student communities.</p>
          <Button size="lg" className="hc-gradient-orange border-0 text-white hover:opacity-90 text-base h-12 px-10" asChild>
            <a href={getLoginUrl()}>Get Started for Free <ArrowRight className="w-5 h-5 ml-1" /></a>
          </Button>
          <p className="text-xs text-muted-foreground">No credit card required. Full access during setup.</p>
        </div>
      </div>
    </div>
  );
}
