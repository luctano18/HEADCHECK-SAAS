import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Brain, Users, AlertTriangle, TrendingUp, Plus, LogOut, User,
  Mail, Shield, BarChart3, Building2, Copy, Loader2, Home, Heart, Settings, Sliders
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { format } from "date-fns";
import { BarChartSkeleton, PieChartSkeleton } from "@/components/ChartSkeleton";

// ─── Employee Resources Panel ───────────────────────────────────────────────
function EmployeeResourcesPanel() {
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resType, setResType] = useState<"article" | "video" | "book" | "exercise" | "tool" | "podcast">("article");
  const { data: resources, refetch: refetchResources } = trpc.business.getResources.useQuery();
  const addMutation = trpc.business.addResource.useMutation({
    onSuccess: () => { toast.success("Resource added!"); setResTitle(""); setResUrl(""); refetchResources(); },
    onError: (err) => toast.error(err.message),
  });
  const removeMutation = trpc.business.removeResource.useMutation({
    onSuccess: () => { toast.success("Resource removed."); refetchResources(); },
    onError: (err) => toast.error(err.message),
  });
  return (
    <Card className="mt-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Employee Wellness Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input placeholder="Resource title" value={resTitle} onChange={e => setResTitle(e.target.value)} />
          <Input placeholder="URL (optional)" value={resUrl} onChange={e => setResUrl(e.target.value)} />
          <select
            value={resType}
            onChange={e => setResType(e.target.value as typeof resType)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            {["article","video","book","exercise","tool","podcast"].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (!resTitle.trim()) { toast.error("Title required"); return; }
            addMutation.mutate({ title: resTitle.trim(), url: resUrl.trim() || undefined, resourceType: resType });
          }}
          disabled={addMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          {addMutation.isPending ? "Adding..." : "Add Resource"}
        </Button>
        {resources && resources.length > 0 && (
          <div className="space-y-2">
            {resources.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{r.title}</span>
                  {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-indigo-500 hover:underline">Link</a>}
                  <Badge variant="secondary" className="ml-2 text-xs">{r.resourceType}</Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeMutation.mutate({ resourceId: r.id })} className="text-destructive hover:text-destructive shrink-0">Remove</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  moderate: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const SEVERITY_BADGES: Record<string, string> = {
  moderate: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

// Brand palette: Indigo, Coral, Teal, Amber, Rose
const CHART_COLORS = ["#4338CA", "#F97316", "#0D9488", "#F59E0B", "#E11D48"];

export default function FacilitatorDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [inviteEmail, setInviteEmail] = useState("");
  const [groupName, setGroupName] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "violence" | "groups" | "assigned" | "eeis" | "pulse" | "sentiment">("overview");
  const [newSurveyTitle, setNewSurveyTitle] = useState("");
  const [newSurveyQuestion, setNewSurveyQuestion] = useState("");
  // EEIS config state
  const { data: eeisConfig, refetch: refetchConfig } = trpc.intervention.getConfig.useQuery(undefined, { enabled: isAuthenticated });
  const updateConfigMutation = trpc.intervention.updateConfig.useMutation({
    onSuccess: () => { toast.success("Intervention thresholds updated."); refetchConfig(); },
    onError: (err) => toast.error(err.message),
  });
  const { data: escalationAlerts } = trpc.intervention.getEscalationAlerts.useQuery(undefined, { enabled: isAuthenticated });
  const { data: pulseSurveys, refetch: refetchSurveys } = trpc.business.getSurveys.useQuery(undefined, { enabled: isAuthenticated });
  const { data: teamSentiment, isLoading: sentimentLoading } = trpc.business.getTeamSentiment.useQuery({ days: 30 }, { enabled: isAuthenticated });
  const createSurveyMutation = trpc.business.createSurvey.useMutation({
    onSuccess: () => { toast.success("Survey created!"); setNewSurveyTitle(""); setNewSurveyQuestion(""); refetchSurveys(); },
    onError: (err) => toast.error(err.message),
  });
  const closeSurveyMutation = trpc.business.closeSurvey.useMutation({
    onSuccess: () => { toast.success("Survey closed."); refetchSurveys(); },
    onError: (err) => toast.error(err.message),
  });
  const [eeisForm, setEeisForm] = useState<{ greenMaxScore: number; yellowMaxScore: number; yellowRepeatDays: number; yellowRepeatCount: number; lowResolutionCount: number } | null>(null);
  const { data: myAssignments } = trpc.crisis.getMyAssignments.useQuery(undefined, { enabled: isAuthenticated });
  const [crisisFilterUnresolved, setCrisisFilterUnresolved] = useState(true);
  const [violenceFilterUnresolved, setViolenceFilterUnresolved] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { refetch: refetchAdvancedReport } = trpc.business.exportAdvancedReport.useQuery(
    { days: 90, includeGroups: true, anonymized: true },
    { enabled: false }
  );

  // Monthly & Group PDF Reports
  const generateMonthlyMutation = trpc.admin.generateMonthlyReport.useMutation({
    onSuccess: (data) => {
      if (data.pdfBase64) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${data.pdfBase64}`;
        link.download = data.filename;
        link.click();
        toast.success(`Monthly report downloaded (${data.month})`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const generateGroupMutation = trpc.admin.generateGroupReport.useMutation({
    onSuccess: (data) => {
      if (data.pdfBase64) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${data.pdfBase64}`;
        link.download = data.filename;
        link.click();
        toast.success(`Group report downloaded (${data.groupName})`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // Group Risk Alerts (Proactive)
  const { data: groupRiskAlerts, refetch: refetchGroupAlerts } = trpc.facilitator.getGroupRiskAlerts.useQuery(undefined, { enabled: isAuthenticated });
  const acknowledgeGroupAlertMutation = trpc.facilitator.acknowledgeGroupRiskAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert acknowledged");
      refetchGroupAlerts();
    },
    onError: (err) => toast.error(err.message),
  });

  const isSuperadmin = user?.role === "superadmin";
  const hasInstitution = !!user?.institutionId;

  const { data: trends, isLoading: trendsLoading } = trpc.facilitator.getCohortTrends.useQuery(
    { days: 30 }, { enabled: isAuthenticated }
  );
  const { data: engagement } = trpc.facilitator.getEngagement.useQuery(undefined, { enabled: isAuthenticated });
  const { data: riskOverview } = trpc.facilitator.getRiskOverview.useQuery(undefined, { enabled: isAuthenticated });
  const { data: groupRisk } = trpc.facilitator.getGroupRiskBreakdown.useQuery(undefined, { enabled: isAuthenticated });
  const { data: crisisAlerts, refetch: refetchAlerts } = trpc.facilitator.getCrisisAlerts.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: violenceFlags, refetch: refetchViolenceFlags } = trpc.crisis.getInstitutionFlags.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const acknowledgeFlagMutation = trpc.crisis.acknowledgeFlag.useMutation({
    onSuccess: () => { toast.success("Alert marked as resolved."); refetchViolenceFlags(); },
    onError: (err) => toast.error(err.message),
  });
  const { data: groups, refetch: refetchGroups } = trpc.institutions.getGroupsWithCounts.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const resolveCrisisAlertMutation = trpc.facilitator.resolveCrisisAlert.useMutation({
    onSuccess: () => { toast.success("Crisis alert marked as resolved."); refetchAlerts(); },
    onError: (err) => toast.error(err.message),
  });

  const inviteMutation = trpc.institutions.inviteStudent.useMutation({
    onSuccess: (data) => {
      const fullLink = `${window.location.origin}${data.inviteLink}`;
      setInviteLink(fullLink);
      toast.success("Invitation created successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const createGroupMutation = trpc.institutions.createGroup.useMutation({
    onSuccess: () => {
      toast.success("Group created!");
      setGroupName("");
      refetchGroups();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Brain className="w-10 h-10 text-primary animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) { navigate("/"); return null; }

  // Build emotion distribution chart data
  const emotionDist = trends
    ? Object.entries(
        trends.reduce((acc: Record<string, number>, t: any) => {
          acc[t.emotion] = (acc[t.emotion] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)
    : [];

  // Build daily intensity trend
  const dailyTrend = trends
    ? Object.entries(
        trends.reduce((acc: Record<string, { sum: number; count: number }>, t: any) => {
          const day = format(new Date(t.createdAt), "MMM d");
          if (!acc[day]) acc[day] = { sum: 0, count: 0 };
          acc[day].sum += t.intensity;
          acc[day].count += 1;
          return acc;
        }, {})
      ).map(([date, { sum, count }]) => ({ date, avg: parseFloat((sum / count).toFixed(1)) }))
    : [];

  const criticalCount = crisisAlerts?.filter((a: any) => a.severity === "critical" && !a.acknowledged).length ?? 0;
  const highCount = crisisAlerts?.filter((a: any) => a.severity === "high" && !a.acknowledged).length ?? 0;
  const violenceCriticalCount = violenceFlags?.filter((f: any) => f.severity === "critical" && !f.acknowledged).length ?? 0;
  const violenceHighCount = violenceFlags?.filter((f: any) => f.severity === "high" && !f.acknowledged).length ?? 0;
  const unacknowledgedViolence = violenceCriticalCount + violenceHighCount;
  const filteredCrisisAlerts = crisisFilterUnresolved
    ? (crisisAlerts ?? []).filter((a: any) => !a.acknowledged)
    : (crisisAlerts ?? []);
  const filteredViolenceFlags = violenceFilterUnresolved
    ? (violenceFlags ?? []).filter((f: any) => !f.acknowledged)
    : (violenceFlags ?? []);

  const assignedCrisisCount = myAssignments?.crisis?.filter((a: any) => !a.acknowledged).length ?? 0;
  const assignedViolenceCount = myAssignments?.violence?.filter((f: any) => !f.acknowledged).length ?? 0;
  const totalAssignedCount = assignedCrisisCount + assignedViolenceCount;

  const TABS = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "alerts", label: "Crisis Alerts", icon: <AlertTriangle className="w-4 h-4" />, badge: criticalCount + highCount },
    { id: "violence", label: "Violence Flags", icon: <Shield className="w-4 h-4" />, badge: unacknowledgedViolence },
    { id: "groupRisk", label: "Group Alerts", icon: <TrendingUp className="w-4 h-4" />, badge: groupRiskAlerts?.length ?? 0 },
    { id: "groups", label: "Groups & Invites", icon: <Users className="w-4 h-4" /> },
    { id: "assigned", label: "Assigned to Me", icon: <Mail className="w-4 h-4" />, badge: totalAssignedCount },
    { id: "eeis", label: "Intervention Config", icon: <Sliders className="w-4 h-4" /> },
    { id: "pulse", label: "Pulse Surveys", icon: <Heart className="w-4 h-4" /> },
    { id: "sentiment", label: "Team Sentiment", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border hidden md:flex">
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">HeadCheck <span className="text-sidebar-primary">AI</span></span>
            </div>
            <Badge className="mt-2 text-xs bg-sidebar-accent text-sidebar-accent-foreground">
              <Building2 className="w-3 h-3 mr-1" /> {isSuperadmin ? "Super Admin" : "Facilitator View"}
            </Badge>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                {tab.icon}
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.badge ? (
                  <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
            <div className="pt-2 border-t border-sidebar-border mt-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/30 border border-emerald-700/30 transition-colors"
              >
                <Home className="w-4 h-4" /> My Personal Dashboard
              </button>
            </div>
          </nav>
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <User className="w-4 h-4 text-sidebar-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name ?? "Facilitator"}</p>
                <p className="text-xs text-sidebar-foreground/50">{isSuperadmin ? "Super Admin" : "Facilitator"}</p>
              </div>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile header */}
          <div className="md:hidden border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="container flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Facilitator Dashboard</span>
              </div>
              <div className="flex gap-1 items-center">
                {TABS.map((t) => (
                  <Button key={t.id} variant={activeTab === t.id ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(t.id as any)}>
                    {t.icon}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="text-emerald-400 hover:text-emerald-200 px-2"
                  title="My Personal Dashboard"
                >
                  <Home className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 max-w-5xl">
            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <>
                <div>
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Cohort Overview</h1>
                  <p className="text-muted-foreground text-sm mt-1">Anonymized emotional wellness trends — last 30 days</p>
                </div>

                {/* Risk Score Banner */}
                {riskOverview && (
                  <Card className={`border-2 ${
                    riskOverview.riskLevel === "high" ? "border-red-300 bg-red-50" :
                    riskOverview.riskLevel === "medium" ? "border-amber-300 bg-amber-50" :
                    "border-emerald-300 bg-emerald-50"
                  }`}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Institution Risk Score</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-4xl font-bold">{riskOverview.riskScore}</span>
                          <span className="text-lg text-muted-foreground">/ 100</span>
                        </div>
                        <Badge className={`mt-2 ${
                          riskOverview.riskLevel === "high" ? "bg-red-600" :
                          riskOverview.riskLevel === "medium" ? "bg-amber-600" :
                          "bg-emerald-600"
                        }`}>
                          {riskOverview.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Top Emotions</p>
                        <div className="mt-1 space-x-1">
                          {riskOverview.topEmotions?.slice(0, 3).map((e: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{e.emotion}</Badge>
                          ))}
                        </div>
                        {riskOverview.highRiskStudents > 0 && (
                          <p className="text-xs text-red-600 mt-2 font-medium">
                            {riskOverview.highRiskStudents} critical alert{riskOverview.highRiskStudents > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Check-Ins", value: trends?.length ?? 0, icon: <Heart className="w-4 h-4 text-rose-500" />, color: "bg-rose-50" },
                    { label: "Active Students", value: engagement?.activeStudents ?? 0, icon: <Users className="w-4 h-4 text-blue-500" />, color: "bg-blue-50" },
                    { label: "Crisis Alerts", value: crisisAlerts?.length ?? 0, icon: <AlertTriangle className="w-4 h-4 text-orange-500" />, color: "bg-orange-50" },
                    { label: "Avg. Intensity", value: trends?.length ? (trends.reduce((s: number, t: any) => s + t.intensity, 0) / trends.length).toFixed(1) : "—", icon: <TrendingUp className="w-4 h-4 text-violet-500" />, color: "bg-violet-50" },
                  ].map((stat) => (
                    <Card key={stat.label} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>{stat.icon}</div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Group Risk Breakdown */}
                {groupRisk && groupRisk.length > 0 && (
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" /> Risk by Group (Last 30 days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {groupRisk.slice(0, 6).map((g: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                            <div>
                              <p className="font-medium text-sm">{g.groupName}</p>
                              <p className="text-xs text-muted-foreground">{g.memberCount} members • {g.totalCheckIns} check-ins</p>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <p className="text-xs text-muted-foreground">Avg Intensity</p>
                                <p className="font-semibold text-sm">{g.avgIntensity}/10</p>
                              </div>
                              <Badge className={
                                g.riskLevel === "high" ? "bg-red-600" :
                                g.riskLevel === "medium" ? "bg-amber-600" : "bg-emerald-600"
                              }>
                                {g.riskLevel}
                              </Badge>
                              <span className="text-xs text-muted-foreground w-16 truncate">{g.topEmotion}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Charts */}
                {trendsLoading ? (
                  /* ── Chart skeletons while cohort data loads ── */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Daily Avg. Intensity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <BarChartSkeleton height={180} bars={7} />
                      </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Emotion Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PieChartSkeleton size={140} />
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dailyTrend.length > 1 && (
                      <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold">Daily Avg. Intensity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={dailyTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.03 260)" />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                              <Bar dataKey="avg" fill="#4338CA" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                    {emotionDist.length > 0 && (
                      <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold">Emotion Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie data={emotionDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                                {emotionDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                {!trendsLoading && (!trends || trends.length === 0) && (
                  <div className="text-center py-12 space-y-3">
                    <div className="text-4xl">📊</div>
                    <p className="text-muted-foreground">No check-in data yet. Invite students to get started.</p>
                  </div>
                )}
              </>
            )}

            {/* ── ALERTS TAB ── */}
            {activeTab === "alerts" && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Crisis Alerts</h1>
                    <p className="text-muted-foreground text-sm mt-1">Anonymized alerts — identities are protected. Contact students through official channels.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-xl p-1 flex-shrink-0">
                    <button
                      onClick={() => setCrisisFilterUnresolved(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        crisisFilterUnresolved ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Unresolved
                    </button>
                    <button
                      onClick={() => setCrisisFilterUnresolved(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        !crisisFilterUnresolved ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>
                {criticalCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive text-sm">{criticalCount} critical alert{criticalCount > 1 ? "s" : ""} require immediate attention</p>
                      <p className="text-xs text-muted-foreground mt-1">Please follow your institution's crisis intervention protocol. The 988 Lifeline has been shown to these students.</p>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {filteredCrisisAlerts.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="text-4xl">✅</div>
                      <p className="text-muted-foreground">
                        {crisisFilterUnresolved ? "No unresolved crisis alerts." : "No crisis alerts at this time."}
                      </p>
                    </div>
                  ) : (
                    filteredCrisisAlerts.map((alert: any) => (
                      <div key={alert.id} className={`rounded-2xl p-4 border flex items-start gap-4 ${
                        alert.acknowledged ? "opacity-50 bg-muted/20 border-border" :
                        alert.severity === "critical" ? "bg-red-50 border-red-200" :
                        alert.severity === "high" ? "bg-orange-50 border-orange-200" :
                        "bg-yellow-50 border-yellow-200"
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          alert.acknowledged ? "bg-muted" :
                          alert.severity === "critical" ? "bg-red-100" :
                          alert.severity === "high" ? "bg-orange-100" : "bg-yellow-100"
                        }`}>
                          <Shield className={`w-5 h-5 ${
                            alert.acknowledged ? "text-muted-foreground" :
                            alert.severity === "critical" ? "text-red-600" :
                            alert.severity === "high" ? "text-orange-600" : "text-yellow-600"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge className={`text-xs ${SEVERITY_BADGES[alert.severity]}`}>{alert.severity?.toUpperCase()}</Badge>
                            {alert.acknowledged && <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">✓ Resolved</Badge>}
                            <span className="text-xs text-muted-foreground">{format(new Date(alert.createdAt), "MMM d, yyyy · h:mm a")}</span>
                          </div>
                          <p className="text-sm text-foreground font-medium">Anonymous Student</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Trigger detected in journal entry</p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/alert/crisis/${alert.id}`)}
                            className="text-xs"
                          >
                            View Details
                          </Button>
                          {!alert.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveCrisisAlertMutation.mutate({ alertId: alert.id })}
                              disabled={resolveCrisisAlertMutation.isPending}
                              className="text-xs"
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ── GROUP RISK ALERTS TAB ── */}
            {activeTab === "groupRisk" && (
              <>
                <div className="mb-6">
                  <h1 className="font-serif text-2xl font-bold text-foreground">Group Risk Alerts</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Automatic alerts when a group’s average emotional intensity exceeds the threshold (≥ 7.0) over the last 3 days.
                  </p>
                </div>

                {!groupRiskAlerts || groupRiskAlerts.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="text-4xl">✅</div>
                    <p className="text-muted-foreground">No active group risk alerts. Your groups are within healthy ranges.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupRiskAlerts.map((alert: any) => (
                      <Card key={alert.id} className="border border-orange-200 bg-orange-50/50">
                        <CardContent className="p-5 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-orange-600">HIGH INTENSITY</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(alert.alertSentAt).toLocaleDateString("en-US")}
                              </span>
                            </div>
                            <p className="font-semibold text-lg">{alert.groupName}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Average intensity over the last {alert.periodDays} days: <span className="font-semibold text-orange-700">{alert.avgIntensity}/10</span>
                              (threshold: {alert.threshold})
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => acknowledgeGroupAlertMutation.mutate({ alertId: alert.id })}
                              disabled={acknowledgeGroupAlertMutation.isPending}
                            >
                              Acknowledge
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── VIOLENCE FLAGS TAB ── */}
            {activeTab === "violence" && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Violence Alerts</h1>
                    <p className="text-muted-foreground text-sm mt-1">Violence signals (self-harm or toward others) detected in entries. Identities are anonymized.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-xl p-1 flex-shrink-0">
                    <button
                      onClick={() => setViolenceFilterUnresolved(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        violenceFilterUnresolved ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Unresolved
                    </button>
                    <button
                      onClick={() => setViolenceFilterUnresolved(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        !violenceFilterUnresolved ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                {violenceCriticalCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive text-sm">{violenceCriticalCount} critical alert{violenceCriticalCount > 1 ? "s" : ""} require{violenceCriticalCount > 1 ? "" : "s"} immediate action</p>
                      <p className="text-xs text-muted-foreground mt-1">Follow your institution's intervention protocol. Crisis resources (988, 741741) have been shown to these students.</p>
                    </div>
                  </div>
                )}

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Critical", count: violenceFlags?.filter((f: any) => f.severity === "critical").length ?? 0, color: "text-red-600", bg: "bg-red-50" },
                    { label: "High", count: violenceFlags?.filter((f: any) => f.severity === "high").length ?? 0, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Moderate", count: violenceFlags?.filter((f: any) => f.severity === "moderate").length ?? 0, color: "text-yellow-600", bg: "bg-yellow-50" },
                  ].map((stat) => (
                    <Card key={stat.label} className="border shadow-sm">
                      <CardContent className="p-4 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-3">
                  {filteredViolenceFlags.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="text-4xl">✅</div>
                      <p className="text-muted-foreground">
                        {violenceFilterUnresolved ? "No unresolved violence alerts." : "No violence signals detected."}
                      </p>
                    </div>
                  ) : (
                    filteredViolenceFlags.map((flag: any) => (
                      <div
                        key={flag.id}
                        className={`rounded-2xl p-4 border flex items-start gap-4 ${
                          flag.acknowledged ? "opacity-50 bg-muted/20 border-border" :
                          flag.severity === "critical" ? "bg-red-50 border-red-200" :
                          flag.severity === "high" ? "bg-orange-50 border-orange-200" :
                          "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          flag.acknowledged ? "bg-muted" :
                          flag.severity === "critical" ? "bg-red-100" :
                          flag.severity === "high" ? "bg-orange-100" : "bg-yellow-100"
                        }`}>
                          <Shield className={`w-5 h-5 ${
                            flag.acknowledged ? "text-muted-foreground" :
                            flag.severity === "critical" ? "text-red-600" :
                            flag.severity === "high" ? "text-orange-600" : "text-yellow-600"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge className={`text-xs ${SEVERITY_BADGES[flag.severity]}`}>{flag.severity?.toUpperCase()}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {flag.flagType === "self_harm" ? "🔴 Self-Harm" : flag.flagType === "violence_toward_others" ? "⚠️ Violence Toward Others" : "🚨 Crisis"}
                            </Badge>
                            {flag.acknowledged && <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">✓ Resolved</Badge>}
                            <span className="text-xs text-muted-foreground">{format(new Date(flag.createdAt), "d MMM yyyy · HH:mm")}</span>
                          </div>
                          <p className="text-sm text-foreground font-medium">Anonymous Student</p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/alert/violence/${flag.id}`)}
                            className="text-xs"
                          >
                            View Details
                          </Button>
                          {!flag.acknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeFlagMutation.mutate({ flagId: flag.id })}
                              disabled={acknowledgeFlagMutation.isPending}
                              className="text-xs"
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ── GROUPS TAB ── */}
            {activeTab === "groups" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Groups & Invitations</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage student cohorts and send invitations.</p>
                  </div>
                </div>

                {/* Create Group */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" /> Create a Group
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Input
                      placeholder="e.g., Grade 10 — Section A"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="h-10"
                    />
                    <Button
                      disabled={!groupName.trim() || createGroupMutation.isPending || (isSuperadmin && !hasInstitution)}
                      onClick={() => createGroupMutation.mutate({ name: groupName.trim() })}
                      className="flex-shrink-0"
                      title={isSuperadmin && !hasInstitution ? "Superadmin must be linked to an institution to create groups" : undefined}
                    >
                      {createGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Groups List + PDF Report Button */}
                {groups && groups.length > 0 && (
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Your Groups ({groups.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {groups.map((g: any) => (
                        <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm flex-1">{g.name}</span>
                          <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {g.memberCount ?? 0} member{g.memberCount !== 1 ? "s" : ""}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateGroupMutation.mutate({ groupId: g.id, groupName: g.name })}
                            disabled={generateGroupMutation.isPending}
                          >
                            PDF Report
                          </Button>
                          <span className="text-xs text-muted-foreground">Created {format(new Date(g.createdAt), "MMM d")}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Invite Student */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" /> Invite a Student
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {groups && groups.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="group-select">Assign to Group <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <select
                          id="group-select"
                          value={selectedGroupId}
                          onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : "")}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">No group (institution-wide)</option>
                          {groups.map((g: any) => (
                            <option key={g.id} value={g.id}>{g.name} ({g.memberCount ?? 0} members)</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Student Email</Label>
                      <div className="flex gap-3">
                        <Input
                          id="email"
                          type="email"
                          placeholder="student@school.edu"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="h-10"
                        />
                        <Button
                          disabled={!inviteEmail.trim() || inviteMutation.isPending || (isSuperadmin && !hasInstitution)}
                          onClick={() => inviteMutation.mutate({ email: inviteEmail.trim(), groupId: selectedGroupId || undefined })}
                          className="flex-shrink-0"
                          title={isSuperadmin && !hasInstitution ? "Superadmin must be linked to an institution to invite students" : undefined}
                        >
                          {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Link"}
                        </Button>
                      </div>
                    </div>
                    {inviteLink && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-medium text-green-700">Invitation link generated!</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white rounded-lg px-3 py-2 border flex-1 truncate">{inviteLink}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Link copied!"); }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">This link expires in 7 days. Share it directly with the student.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
               </>
            )}

            {/* ─── Assigned to Me ─────────────────────────────────────────────────── */}
            {activeTab === "assigned" && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">Assigned to Me</h2>
                  <p className="text-sm text-muted-foreground mt-1">Alerts assigned to you for follow-up. Identities are anonymized.</p>
                </div>

                {/* Crisis Assignments */}
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Crisis Alerts ({assignedCrisisCount} unresolved)
                  </h3>
                  {!myAssignments?.crisis?.length ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No crisis alerts assigned to you.</p>
                  ) : (
                    <div className="space-y-3">
                      {myAssignments.crisis.map((alert: any) => (
                        <Card key={alert.id} className={`border ${alert.acknowledged ? "border-gray-200 opacity-60" : "border-red-200"}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <AlertTriangle className={`w-4 h-4 ${alert.acknowledged ? "text-gray-400" : "text-red-500"}`} />
                                <div>
                                  <p className="text-sm font-medium">Crisis Alert #{alert.id}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString("en-US")}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={SEVERITY_BADGES[alert.severity] ?? ""}>{alert.severity}</Badge>
                                {alert.acknowledged && <Badge className="bg-emerald-100 text-emerald-700">Resolved</Badge>}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/alert/crisis/${alert.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Violence Assignments */}
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-500" /> Violence Flags ({assignedViolenceCount} unresolved)
                  </h3>
                  {!myAssignments?.violence?.length ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No violence flags assigned to you.</p>
                  ) : (
                    <div className="space-y-3">
                      {myAssignments.violence.map((flag: any) => (
                        <Card key={flag.id} className={`border ${flag.acknowledged ? "border-gray-200 opacity-60" : "border-orange-200"}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Shield className={`w-4 h-4 ${flag.acknowledged ? "text-gray-400" : "text-orange-500"}`} />
                                <div>
                                  <p className="text-sm font-medium">Violence Flag #{flag.id}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(flag.createdAt).toLocaleString("en-US")}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={SEVERITY_BADGES[flag.severity] ?? ""}>{flag.severity}</Badge>
                                {flag.acknowledged && <Badge className="bg-emerald-100 text-emerald-700">Resolved</Badge>}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/alert/violence/${flag.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

            {/* ── EEIS: Intervention Config Tab ── */}
            {activeTab === "eeis" && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">Intervention Configuration</h2>
                  <p className="text-sm text-muted-foreground mt-1">Configure the scoring thresholds that determine Green / Yellow / Red classification for your institution.</p>
                </div>

                {/* Threshold Config Card */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-500" /> Scoring Thresholds
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {eeisConfig && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Green Max Score (0–{(eeisForm ?? eeisConfig).yellowMaxScore - 1})</Label>
                            <p className="text-xs text-muted-foreground mb-1">Sessions scoring ≤ this are classified Green</p>
                            <input
                              type="number" min={1} max={8}
                              value={(eeisForm ?? eeisConfig).greenMaxScore}
                              onChange={e => setEeisForm(f => ({ ...(f ?? eeisConfig), greenMaxScore: Number(e.target.value) }))}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Yellow Max Score</Label>
                            <p className="text-xs text-muted-foreground mb-1">Sessions scoring ≤ this are Yellow; above is Red</p>
                            <input
                              type="number" min={2} max={11}
                              value={(eeisForm ?? eeisConfig).yellowMaxScore}
                              onChange={e => setEeisForm(f => ({ ...(f ?? eeisConfig), yellowMaxScore: Number(e.target.value) }))}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Yellow Repeat Window (days)</Label>
                            <p className="text-xs text-muted-foreground mb-1">Lookback window for escalation pattern detection</p>
                            <input
                              type="number" min={1} max={30}
                              value={(eeisForm ?? eeisConfig).yellowRepeatDays}
                              onChange={e => setEeisForm(f => ({ ...(f ?? eeisConfig), yellowRepeatDays: Number(e.target.value) }))}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Yellow Repeat Count</Label>
                            <p className="text-xs text-muted-foreground mb-1">Number of Yellow sessions in window to trigger escalation</p>
                            <input
                              type="number" min={1} max={10}
                              value={(eeisForm ?? eeisConfig).yellowRepeatCount}
                              onChange={e => setEeisForm(f => ({ ...(f ?? eeisConfig), yellowRepeatCount: Number(e.target.value) }))}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Low Resolution Count</Label>
                            <p className="text-xs text-muted-foreground mb-1">Consecutive "not yet" responses before flagging</p>
                            <input
                              type="number" min={1} max={10}
                              value={(eeisForm ?? eeisConfig).lowResolutionCount}
                              onChange={e => setEeisForm(f => ({ ...(f ?? eeisConfig), lowResolutionCount: Number(e.target.value) }))}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            onClick={() => {
                              const cfg = eeisForm ?? eeisConfig;
                              updateConfigMutation.mutate(cfg);
                            }}
                            disabled={updateConfigMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {updateConfigMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Thresholds
                          </Button>
                          <Button variant="outline" onClick={() => setEeisForm(null)}>Reset to Saved</Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Tier Reference */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base">Tier Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center">
                        <span className="text-2xl">🌱</span>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mt-1">Green</p>
                        <p className="text-xs text-muted-foreground">Score ≤ {eeisConfig?.greenMaxScore ?? 4}</p>
                        <p className="text-xs text-muted-foreground mt-1">Grounding + affirmation</p>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4 text-center">
                        <span className="text-2xl">🌤</span>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mt-1">Yellow</p>
                        <p className="text-xs text-muted-foreground">Score ≤ {eeisConfig?.yellowMaxScore ?? 9}</p>
                        <p className="text-xs text-muted-foreground mt-1">Breathing + peer support</p>
                      </div>
                      <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-center">
                        <span className="text-2xl">🌧</span>
                        <p className="text-sm font-semibold text-rose-800 dark:text-rose-300 mt-1">Red</p>
                        <p className="text-xs text-muted-foreground">Score &gt; {eeisConfig?.yellowMaxScore ?? 9}</p>
                        <p className="text-xs text-muted-foreground mt-1">Counselor escalation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Escalation Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Recent Escalation Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!escalationAlerts?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No escalation alerts yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {escalationAlerts.map((alert) => (
                          <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  alert.tier === "red" ? "bg-rose-100 text-rose-700" :
                                  alert.tier === "yellow" ? "bg-amber-100 text-amber-700" :
                                  "bg-emerald-100 text-emerald-700"
                                }`}>{alert.tier?.toUpperCase()}</span>
                                <span className="text-xs text-muted-foreground">Score: {alert.totalScore}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{alert.escalationReason ?? "Escalation triggered"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{alert.createdAt ? new Date(alert.createdAt).toLocaleDateString("en-US") : ""}</p>
                              {alert.facilitatorNotified && (
                                <Badge className="text-xs bg-indigo-100 text-indigo-700 mt-1">Notified</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* ── Pulse Surveys Tab ── */}
            {activeTab === "pulse" && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Pulse Surveys</h2>
                    <p className="text-sm text-muted-foreground mt-1">Create and manage team wellness surveys.</p>
                  </div>
                </div>

                {/* Create Survey Form */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Create New Survey</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="survey-title" className="text-sm">Survey Title</Label>
                      <Input
                        id="survey-title"
                        placeholder="e.g. Weekly Wellness Check"
                        value={newSurveyTitle}
                        onChange={(e) => setNewSurveyTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="survey-question" className="text-sm">Question</Label>
                      <Input
                        id="survey-question"
                        placeholder="e.g. How supported do you feel at work this week?"
                        value={newSurveyQuestion}
                        onChange={(e) => setNewSurveyQuestion(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!newSurveyTitle.trim() || !newSurveyQuestion.trim()) {
                          toast.error("Please fill in both title and question.");
                          return;
                        }
                        createSurveyMutation.mutate({ title: newSurveyTitle.trim(), question: newSurveyQuestion.trim() });
                      }}
                      disabled={createSurveyMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {createSurveyMutation.isPending ? "Creating..." : "Create Survey"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Survey List */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">All Surveys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!pulseSurveys || pulseSurveys.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No surveys created yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {pulseSurveys.map((survey: any) => (
                          <div key={survey.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{survey.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{survey.question}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(survey.createdAt).toLocaleDateString("en-US")}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={survey.isActive ? "text-green-600 border-green-300" : "text-muted-foreground"}>
                                {survey.isActive ? "Active" : "Closed"}
                              </Badge>
                              {survey.isActive && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => closeSurveyMutation.mutate({ surveyId: survey.id })}
                                  disabled={closeSurveyMutation.isPending}
                                  className="text-xs"
                                >
                                  Close
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Employee Wellness Resources */}
                <EmployeeResourcesPanel />
              </div>
            )}

            {/* Export Button (visible in Overview) */}
            {activeTab === "overview" && (
              <div className="flex justify-end gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => generateMonthlyMutation.mutate()}
                  disabled={generateMonthlyMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {generateMonthlyMutation.isPending ? "Generating..." : "Monthly PDF Report"}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      const result = await refetchAdvancedReport();
                      const data = result.data;
                      if (!data) {
                        toast.error("No data to export");
                        return;
                      }
                      // Generate CSV
                      const csv = [
                        "Date,Check-ins,Avg Intensity,Top Emotion",
                        ...data.daily.map((d: any) => `${d.date},${d.checkIns},${d.avgIntensity},${d.topEmotion}`),
                        "",
                        "Group,Check-ins,Avg Intensity",
                        ...data.byGroup.map((g: any) => `${g.group},${g.checkIns},${g.avgIntensity}`),
                      ].join("\n");

                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `headcheck-advanced-report-${new Date().toISOString().slice(0, 10)}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Advanced report exported!");
                    } catch {
                      toast.error("Export failed");
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  disabled={isExporting}
                >
                  <Download className={`w-4 h-4 mr-2 ${isExporting ? "animate-spin" : ""}`} />
                  {isExporting ? "Exporting..." : "Export Advanced CSV"}
                </Button>
              </div>
            )}

            {/* ── Team Sentiment Tab ── */}
            {activeTab === "sentiment" && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Team Sentiment</h2>
                  <p className="text-sm text-muted-foreground mt-1">Aggregate emotional wellness analytics for your team (last 30 days).</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sentimentLoading ? (
                    [1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="py-5"><div className="h-8 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-3/4" /></CardContent></Card>)
                  ) : (
                    <>
                      <Card><CardContent className="flex items-center gap-3 py-5"><div className="p-2 rounded-lg bg-indigo-500"><TrendingUp className="w-4 h-4 text-white" /></div><div><p className="text-2xl font-bold">{teamSentiment?.avgIntensity ?? 0}/10</p><p className="text-xs text-muted-foreground">Avg Intensity</p></div></CardContent></Card>
                      <Card><CardContent className="flex items-center gap-3 py-5"><div className="p-2 rounded-lg bg-teal-500"><Users className="w-4 h-4 text-white" /></div><div><p className="text-2xl font-bold">{teamSentiment?.totalCheckIns ?? 0}</p><p className="text-xs text-muted-foreground">Total Check-ins</p></div></CardContent></Card>
                      <Card><CardContent className="flex items-center gap-3 py-5"><div className="p-2 rounded-lg bg-amber-500"><Heart className="w-4 h-4 text-white" /></div><div><p className="text-2xl font-bold">{teamSentiment?.topEmotions?.[0]?.emotion ?? "—"}</p><p className="text-xs text-muted-foreground">Top Emotion</p></div></CardContent></Card>
                    </>
                  )}
                </div>

                {/* Top Emotions Bar Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Emotions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sentimentLoading ? <div className="h-48 bg-muted/30 rounded animate-pulse" /> : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={teamSentiment?.topEmotions ?? []} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="emotion" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" name="Check-ins" fill="#4338CA" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Daily Trend */}
                {!sentimentLoading && (teamSentiment?.trendData?.length ?? 0) > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Daily Intensity Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={teamSentiment!.trendData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => [`${v}/10`, "Avg Intensity"]} />
                          <Bar dataKey="avgIntensity" name="Avg Intensity" fill="#F97316" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

        </main>
      </div>
    </div>
  );
}
