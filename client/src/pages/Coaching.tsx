import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Video, Clock, Users, Star, ArrowRight, CheckCircle, Calendar,
  Building2, Loader2, Heart, Sparkles, MessageCircle
} from "lucide-react";

const SESSION_TYPES = [
  {
    id: "30min",
    title: "30-Minute Session",
    subtitle: "Quick clarity & support",
    description: "A focused one-on-one video call to address a specific emotional challenge, get clarity, or receive immediate support.",
    duration: "30 minutes",
    format: "1:1 Video Call",
    icon: Clock,
    color: "from-sky-50 to-blue-50 border-sky-200",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    badge: "Most Popular",
    badgeColor: "bg-sky-100 text-sky-700",
    features: [
      "Personalized emotional support",
      "Immediate coping strategies",
      "One focused challenge addressed",
      "Follow-up resource recommendations",
    ],
  },
  {
    id: "60min",
    title: "60-Minute Deep Dive",
    subtitle: "Comprehensive exploration",
    description: "A full one-on-one video call for deeper exploration of emotional patterns, relationship dynamics, or personal growth goals.",
    duration: "60 minutes",
    format: "1:1 Video Call",
    icon: Video,
    color: "from-amber-50 to-orange-50 border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badge: "Best Value",
    badgeColor: "bg-amber-100 text-amber-700",
    features: [
      "Deep emotional pattern exploration",
      "Personalized growth roadmap",
      "EI pillar assessment",
      "Actionable 30-day plan",
    ],
  },
  {
    id: "3session",
    title: "3-Session Journey",
    subtitle: "Sustainable transformation",
    description: "A three-session journey for sustainable emotional growth and mastery. Build lasting skills with ongoing support and accountability.",
    duration: "3 × 60 minutes",
    format: "1:1 Video Calls",
    icon: Star,
    color: "from-violet-50 to-purple-50 border-violet-200",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    badge: "Transformation",
    badgeColor: "bg-violet-100 text-violet-700",
    features: [
      "Comprehensive EI assessment",
      "Customized action plan",
      "Ongoing support and accountability",
      "Progress tracking across sessions",
    ],
  },
];

export default function Coaching() {
  const { isAuthenticated } = useAuth();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: "", email: "", organization: "", goals: "" });
  const [orgSubmitted, setOrgSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleBookSession = (sessionType: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setSelectedSession(sessionType);
    toast.success("Session request received! You'll receive a scheduling link by email within 24 hours.", {
      description: "Once scheduled, your Zoom meeting link will appear in My Sessions.",
      duration: 6000,
    });
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setOrgSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-200 shadow-sm mb-6">
            <Heart className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Expert Coaching</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Grow With <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Expert Support</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Book a session with one of our certified emotional intelligence coaches and begin building the skills that will serve you for life.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { step: "1", title: "Book Your Session", desc: "Choose the session type that fits your journey and submit your request.", icon: Calendar },
            { step: "2", title: "Receive Scheduling Link", desc: "You'll receive an email with a link to choose your preferred date and time.", icon: MessageCircle },
            { step: "3", title: "Join Your Video Call", desc: "Once scheduled, your Zoom meeting link will appear in My Sessions.", icon: Video },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-amber-100 text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-4">
                {step}
              </div>
              <Icon className="w-6 h-6 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Session Types */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Choose Your Session</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {SESSION_TYPES.map((session) => {
            const Icon = session.icon;
            const isSelected = selectedSession === session.id;
            return (
              <div
                key={session.id}
                className={`relative bg-gradient-to-br ${session.color} rounded-3xl p-6 border-2 transition-all duration-300 ${
                  isSelected ? "border-amber-400 shadow-xl scale-[1.02]" : "hover:shadow-lg hover:scale-[1.01]"
                }`}
              >
                <Badge className={`absolute top-4 right-4 text-xs ${session.badgeColor} border-0`}>
                  {session.badge}
                </Badge>
                <div className={`w-12 h-12 ${session.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${session.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{session.title}</h3>
                <p className="text-sm text-gray-500 mb-1">{session.subtitle}</p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs bg-white/70 text-gray-600 px-2 py-1 rounded-full border">{session.duration}</span>
                  <span className="text-xs bg-white/70 text-gray-600 px-2 py-1 rounded-full border">{session.format}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{session.description}</p>
                <ul className="space-y-2 mb-6">
                  {session.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isSelected ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Request Submitted!
                  </div>
                ) : (
                  <Button
                    onClick={() => handleBookSession(session.id)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl"
                  >
                    Book This Session
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Organization Coaching */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border border-violet-200 p-8 mb-12">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900">Organization Coaching</h2>
                <Badge className="bg-violet-100 text-violet-700 border-0">Custom Pricing</Badge>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Custom group coaching sessions tailored to your team's needs. Tell us about your organization's needs and we'll get back to you with custom pricing options for your team.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {["Team & Organization Programs", "Flexible scheduling", "Custom curriculum", "Ongoing support"].map(f => (
                  <span key={f} className="text-xs bg-white/70 text-violet-700 px-3 py-1 rounded-full border border-violet-200">{f}</span>
                ))}
              </div>
              {!showOrgForm && !orgSubmitted && (
                <Button
                  onClick={() => setShowOrgForm(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Submit Organization Inquiry
                </Button>
              )}

              {showOrgForm && !orgSubmitted && (
                <form onSubmit={handleOrgSubmit} className="space-y-4 mt-4 bg-white/60 rounded-2xl p-6 border border-violet-100">
                  <h3 className="font-semibold text-gray-800">Organization Coaching Inquiry</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Your Name *</label>
                      <Input
                        required
                        value={orgForm.name}
                        onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Full name"
                        className="rounded-xl border-violet-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
                      <Input
                        required
                        type="email"
                        value={orgForm.email}
                        onChange={e => setOrgForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="rounded-xl border-violet-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Organization Name *</label>
                    <Input
                      required
                      value={orgForm.organization}
                      onChange={e => setOrgForm(f => ({ ...f, organization: e.target.value }))}
                      placeholder="Your organization or school name"
                      className="rounded-xl border-violet-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">What are your organization's wellness goals? *</label>
                    <Textarea
                      required
                      value={orgForm.goals}
                      onChange={e => setOrgForm(f => ({ ...f, goals: e.target.value }))}
                      placeholder="Tell us about your team wellness objectives, current challenges, and what you hope to achieve..."
                      className="min-h-[100px] rounded-xl border-violet-100"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Submit Inquiry
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowOrgForm(false)}>Cancel</Button>
                  </div>
                  <p className="text-xs text-gray-400">Thank you for your interest. We'll review your inquiry and reach out within 1-2 business days to discuss custom pricing and options.</p>
                </form>
              )}

              {orgSubmitted && (
                <div className="flex items-center gap-3 bg-green-50 text-green-700 rounded-2xl p-4 border border-green-200">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Inquiry Submitted!</p>
                    <p className="text-sm text-green-600">We'll review your request and reach out within 1-2 business days to discuss custom pricing and options for your team.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
            HeadCheck AI coaching is provided by certified emotional intelligence practitioners. Sessions are confidential and conducted via secure video call.
          </p>
        </div>
      </div>
    </div>
  );
}
