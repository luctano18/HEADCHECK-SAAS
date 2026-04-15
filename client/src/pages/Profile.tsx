import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  User, Mail, Phone, Globe, Bell, BellOff, Camera,
  Flame, Trophy, Calendar, CheckCircle2, ArrowLeft,
  Shield, Star, Edit3, Save, X, Clock, BarChart3,
  Heart, Zap, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Vancouver", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid",
  "Africa/Abidjan", "Africa/Lagos", "Africa/Nairobi", "Africa/Accra",
  "Africa/Johannesburg", "Africa/Dakar",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo",
  "Australia/Sydney", "Pacific/Auckland",
];

const LANGUAGES = [
  { code: "en", label: "English (US)" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "sw", label: "Kiswahili" },
];

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    superadmin: "Super Admin",
    admin: "Administrator",
    facilitator: "Facilitator",
    student: "Student",
  };
  return map[role] ?? role;
}

function roleBadgeColor(role: string) {
  const map: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-700 border-purple-200",
    admin: "bg-blue-100 text-blue-700 border-blue-200",
    facilitator: "bg-emerald-100 text-emerald-700 border-emerald-200",
    student: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return map[role] ?? "bg-gray-100 text-gray-600 border-gray-200";
}

// ─── Browser Push Toggle sub-component ──────────────────────────────────────
function BrowserPushToggle() {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (permission === "unsupported") {
    return (
      <div className="flex items-center justify-between py-2 opacity-50">
        <div>
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            Browser Push Notifications
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Not supported by your browser</p>
        </div>
        <Badge variant="outline" className="text-xs text-gray-400">Unsupported</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="w-4 h-4 text-indigo-500" />
          ) : (
            <BellOff className="w-4 h-4 text-gray-400" />
          )}
          Browser Push Notifications
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {permission === "denied"
            ? "Blocked — enable in browser settings"
            : isSubscribed
            ? "Active — you'll receive alerts even when the tab is closed"
            : "Get alerted even when HeadCheck is not open"}
        </p>
      </div>
      <Switch
        checked={isSubscribed}
        onCheckedChange={(v) => (v ? subscribe() : unsubscribe())}
        disabled={isLoading || permission === "denied"}
      />
    </div>
  );
}

export default function Profile() {
  const [, navigate] = useLocation();
  const { user: authUser } = useAuth();

  const { data: profile, isLoading: profileLoading, refetch } = trpc.profile.getMe.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.profile.getStats.useQuery();

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    phone: "",
    timezone: "",
    language: "en",
    notificationsEnabled: true,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        bio: (profile as any).bio ?? "",
        phone: (profile as any).phone ?? "",
        timezone: (profile as any).timezone ?? "",
        language: (profile as any).language ?? "en",
        notificationsEnabled: (profile as any).notificationsEnabled ?? true,
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateMutation.mutate({
      name: form.name || undefined,
      bio: form.bio || undefined,
      phone: form.phone || undefined,
      timezone: form.timezone || undefined,
      language: form.language || undefined,
      notificationsEnabled: form.notificationsEnabled,
    });
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        bio: (profile as any).bio ?? "",
        phone: (profile as any).phone ?? "",
        timezone: (profile as any).timezone ?? "",
        language: (profile as any).language ?? "en",
        notificationsEnabled: (profile as any).notificationsEnabled ?? true,
      });
    }
    setEditing(false);
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-violet-400 mx-auto" />
          <p className="text-gray-600 font-medium">Please sign in to view your profile.</p>
          <Button onClick={() => navigate("/login")} className="bg-violet-600 hover:bg-violet-700 text-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile?.name, profile?.email);
  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—";
  const lastSeen = profile?.lastSignedIn ? new Date(profile.lastSignedIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/40">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-sm font-semibold text-gray-700">My Profile</span>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-2">
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} className="gap-1 text-gray-500">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="gap-1 bg-violet-600 hover:bg-violet-700 text-white">
              <Save className="w-3.5 h-3.5" /> {updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero Card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold select-none">
                  {(profile as any)?.avatarUrl ? (
                    <img src={(profile as any).avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-xl" />
                  ) : initials}
                </div>
                {editing && (
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center shadow-md hover:bg-violet-700 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
              {/* Role badge */}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${roleBadgeColor(profile?.role ?? "student")}`}>
                {roleLabel(profile?.role ?? "student")}
              </span>
            </div>

            {editing ? (
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className="text-xl font-bold border-violet-200 focus:border-violet-400 mb-2"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900">{profile?.name ?? "—"}</h1>
            )}
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" /> {profile?.email ?? "—"}
            </p>

            {editing ? (
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Write a short bio about yourself… (max 500 characters)"
                maxLength={500}
                rows={3}
                className="mt-3 text-sm border-violet-200 focus:border-violet-400 resize-none"
              />
            ) : (
              (profile as any)?.bio && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{(profile as any).bio}</p>
              )
            )}

            <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-violet-400" /> Joined {joinDate}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> Last active {lastSeen}</span>
              {profile?.loginMethod && (
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-400" /> via {profile.loginMethod}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <BarChart3 className="w-5 h-5 text-violet-500" />, label: "Total Check-Ins", value: statsLoading ? "…" : (stats?.totalCheckIns ?? 0), bg: "from-violet-50 to-violet-100/50" },
            { icon: <Flame className="w-5 h-5 text-orange-500" />, label: "Current Streak", value: statsLoading ? "…" : `${stats?.currentStreak ?? 0} days`, bg: "from-orange-50 to-orange-100/50" },
            { icon: <Zap className="w-5 h-5 text-yellow-500" />, label: "Best Streak", value: statsLoading ? "…" : `${stats?.longestStreak ?? 0} days`, bg: "from-yellow-50 to-yellow-100/50" },
            { icon: <Trophy className="w-5 h-5 text-emerald-500" />, label: "Achievements", value: statsLoading ? "…" : (stats?.achievements?.length ?? 0), bg: "from-emerald-50 to-emerald-100/50" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.bg} rounded-xl p-4 border border-white shadow-sm`}>
              <div className="flex items-center gap-2 mb-1">{s.icon}</div>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Achievements ──────────────────────────────────────────────── */}
        {(stats?.achievements?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-yellow-500" /> Recent Achievements
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats!.achievements.map((a) => (
                <span key={a.id} className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-medium px-3 py-1.5 rounded-full">
                  <span>{a.achievementEmoji}</span> {a.achievementTitle}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Personal Info ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-500" /> Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
              </label>
              {editing ? (
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="text-sm border-gray-200 focus:border-violet-400"
                />
              ) : (
                <p className="text-sm text-gray-700">{(profile as any)?.phone || <span className="text-gray-400 italic">Not provided</span>}</p>
              )}
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Language
              </label>
              {editing ? (
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 bg-white"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-700">
                  {LANGUAGES.find((l) => l.code === ((profile as any)?.language ?? "en"))?.label ?? "English (US)"}
                </p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Timezone
              </label>
              {editing ? (
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 bg-white"
                >
                  <option value="">— Select timezone —</option>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-700">
                  {(profile as any)?.timezone || <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" /> Preferences
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                {form.notificationsEnabled ? <Bell className="w-4 h-4 text-indigo-500" /> : <BellOff className="w-4 h-4 text-gray-400" />}
                Email Notifications
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Receive email alerts for crisis events and assignments</p>
            </div>
            <Switch
              checked={form.notificationsEnabled}
              onCheckedChange={(v) => {
                setForm({ ...form, notificationsEnabled: v });
                if (!editing) {
                  updateMutation.mutate({ notificationsEnabled: v });
                }
              }}
              disabled={updateMutation.isPending}
            />
          </div>

          <BrowserPushToggle />

          <Separator />

          <div className="flex items-center justify-between py-2 opacity-60">
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" /> Weekly Wellness Summary
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Email digest of your emotional wellness trends</p>
            </div>
            <Badge variant="outline" className="text-xs text-gray-400">Coming soon</Badge>
          </div>

          <div className="flex items-center justify-between py-2 opacity-60">
            <div>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" /> Achievement Alerts
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Get notified when you earn a new badge</p>
            </div>
            <Badge variant="outline" className="text-xs text-gray-400">Coming soon</Badge>
          </div>
        </div>

        {/* ── Account Info ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" /> Account Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Account ID</p>
              <p className="font-mono text-gray-700 text-xs bg-gray-50 px-2 py-1 rounded">{profile?.id ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Login Method</p>
              <p className="text-gray-700 capitalize">{profile?.loginMethod ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Role</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleBadgeColor(profile?.role ?? "student")}`}>
                {roleLabel(profile?.role ?? "student")}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Member Since</p>
              <p className="text-gray-700">{joinDate}</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2 text-violet-600 border-violet-200 hover:bg-violet-50"
            >
              <BarChart3 className="w-3.5 h-3.5" /> My Dashboard
            </Button>
            {(profile?.role === "admin" || profile?.role === "superadmin" || profile?.role === "facilitator") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/facilitator")}
                className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Shield className="w-3.5 h-3.5" /> Facilitator View
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/checkin")}
              className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Start Check-In
            </Button>
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
