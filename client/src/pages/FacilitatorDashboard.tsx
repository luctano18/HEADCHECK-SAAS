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
  Mail, Shield, BarChart3, Building2, Copy, Loader2, Home, Heart
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { format } from "date-fns";

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

const CHART_COLORS = ["oklch(0.52 0.15 290)", "oklch(0.72 0.12 10)", "oklch(0.55 0.10 155)", "oklch(0.62 0.16 75)", "oklch(0.65 0.14 220)"];

export default function FacilitatorDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [inviteEmail, setInviteEmail] = useState("");
  const [groupName, setGroupName] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "violence" | "groups">("overview");

  const { data: trends, isLoading: trendsLoading } = trpc.facilitator.getCohortTrends.useQuery(
    { days: 30 }, { enabled: isAuthenticated }
  );
  const { data: engagement } = trpc.facilitator.getEngagement.useQuery(undefined, { enabled: isAuthenticated });
  const { data: crisisAlerts, refetch: refetchAlerts } = trpc.facilitator.getCrisisAlerts.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: violenceFlags, refetch: refetchViolenceFlags } = trpc.crisis.getInstitutionFlags.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const acknowledgeFlagMutation = trpc.crisis.acknowledgeFlag.useMutation({
    onSuccess: () => { toast.success("Alerte marquée comme traitée."); refetchViolenceFlags(); },
    onError: (err) => toast.error(err.message),
  });
  const { data: groups, refetch: refetchGroups } = trpc.institutions.getGroups.useQuery(
    undefined, { enabled: isAuthenticated }
  );

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

  const criticalCount = crisisAlerts?.filter((a: any) => a.severity === "critical").length ?? 0;
  const highCount = crisisAlerts?.filter((a: any) => a.severity === "high").length ?? 0;
  const violenceCriticalCount = violenceFlags?.filter((f: any) => f.severity === "critical" && !f.acknowledged).length ?? 0;
  const violenceHighCount = violenceFlags?.filter((f: any) => f.severity === "high" && !f.acknowledged).length ?? 0;
  const unacknowledgedViolence = violenceCriticalCount + violenceHighCount;

  const TABS = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "alerts", label: "Crisis Alerts", icon: <AlertTriangle className="w-4 h-4" />, badge: criticalCount + highCount },
    { id: "violence", label: "Violence Flags", icon: <Shield className="w-4 h-4" />, badge: unacknowledgedViolence },
    { id: "groups", label: "Groups & Invites", icon: <Users className="w-4 h-4" /> },
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
              <Building2 className="w-3 h-3 mr-1" /> Facilitator View
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
              >
                <Home className="w-4 h-4" /> My Dashboard
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
                <p className="text-xs text-sidebar-foreground/50">Facilitator</p>
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
              <div className="flex gap-2">
                {TABS.map((t) => (
                  <Button key={t.id} variant={activeTab === t.id ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(t.id as any)}>
                    {t.icon}
                  </Button>
                ))}
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

                {/* Charts */}
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
                            <Bar dataKey="avg" fill="oklch(0.52 0.15 290)" radius={[4, 4, 0, 0]} />
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

                {trendsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                <div>
                  <h1 className="font-serif text-2xl font-bold text-foreground">Crisis Alerts</h1>
                  <p className="text-muted-foreground text-sm mt-1">Anonymized alerts — identities are protected. Contact students through official channels.</p>
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
                  {!crisisAlerts || crisisAlerts.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="text-4xl">✅</div>
                      <p className="text-muted-foreground">No crisis alerts at this time.</p>
                    </div>
                  ) : (
                    crisisAlerts.map((alert: any) => (
                      <div key={alert.id} className={`rounded-2xl p-4 border flex items-start gap-4 ${alert.severity === "critical" ? "bg-red-50 border-red-200" : alert.severity === "high" ? "bg-orange-50 border-orange-200" : "bg-yellow-50 border-yellow-200"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.severity === "critical" ? "bg-red-100" : alert.severity === "high" ? "bg-orange-100" : "bg-yellow-100"}`}>
                          <Shield className={`w-5 h-5 ${alert.severity === "critical" ? "text-red-600" : alert.severity === "high" ? "text-orange-600" : "text-yellow-600"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${SEVERITY_BADGES[alert.severity]}`}>{alert.severity?.toUpperCase()}</Badge>
                            <span className="text-xs text-muted-foreground">{format(new Date(alert.createdAt), "MMM d, yyyy · h:mm a")}</span>
                          </div>
                          <p className="text-sm text-foreground font-medium">Anonymous Student</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {alert.resolved ? "Resolved" : "Unresolved"} · Trigger detected in journal entry
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ── VIOLENCE FLAGS TAB ── */}
            {activeTab === "violence" && (
              <>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-foreground">Alertes de Violence</h1>
                  <p className="text-muted-foreground text-sm mt-1">Signaux de violence (auto-destruction ou envers autrui) détectés dans les entrées. Identités anonymisées.</p>
                </div>

                {violenceCriticalCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive text-sm">{violenceCriticalCount} alerte{violenceCriticalCount > 1 ? "s" : ""} critique{violenceCriticalCount > 1 ? "s" : ""} nécessite{violenceCriticalCount > 1 ? "nt" : ""} une action immédiate</p>
                      <p className="text-xs text-muted-foreground mt-1">Suivez le protocole d'intervention de votre établissement. Les ressources de crise (3114, 988) ont été affichées à ces étudiants.</p>
                    </div>
                  </div>
                )}

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Critique", count: violenceFlags?.filter((f: any) => f.severity === "critical").length ?? 0, color: "text-red-600", bg: "bg-red-50" },
                    { label: "Haute", count: violenceFlags?.filter((f: any) => f.severity === "high").length ?? 0, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Modérée", count: violenceFlags?.filter((f: any) => f.severity === "moderate").length ?? 0, color: "text-yellow-600", bg: "bg-yellow-50" },
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
                  {!violenceFlags || violenceFlags.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="text-4xl">✅</div>
                      <p className="text-muted-foreground">Aucun signal de violence détecté.</p>
                    </div>
                  ) : (
                    violenceFlags.map((flag: any) => (
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
                              {flag.flagType === "self_harm" ? "🔴 Auto-destruction" : flag.flagType === "violence_toward_others" ? "⚠️ Violence envers autrui" : "🚨 Crise"}
                            </Badge>
                            {flag.acknowledged && <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">✓ Traité</Badge>}
                            <span className="text-xs text-muted-foreground">{format(new Date(flag.createdAt), "d MMM yyyy · HH:mm")}</span>
                          </div>
                          <p className="text-sm text-foreground font-medium">Étudiant anonyme</p>
                        </div>
                        {!flag.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeFlagMutation.mutate({ flagId: flag.id })}
                            disabled={acknowledgeFlagMutation.isPending}
                            className="flex-shrink-0 text-xs"
                          >
                            Marquer traité
                          </Button>
                        )}
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
                      disabled={!groupName.trim() || createGroupMutation.isPending}
                      onClick={() => createGroupMutation.mutate({ name: groupName.trim() })}
                      className="flex-shrink-0"
                    >
                      {createGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Groups List */}
                {groups && groups.length > 0 && (
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Your Groups</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {groups.map((g: any) => (
                        <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm flex-1">{g.name}</span>
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
                          disabled={!inviteEmail.trim() || inviteMutation.isPending}
                          onClick={() => inviteMutation.mutate({ email: inviteEmail.trim() })}
                          className="flex-shrink-0"
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
          </div>
        </main>
      </div>
    </div>
  );
}
