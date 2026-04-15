import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import NavBar from "@/components/NavBar";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRPCError } from "@trpc/server";

type FilterType = "all" | "unread";

const TYPE_EMOJI: Record<string, string> = {
  crisis_alert: "⚠️",
  violence_flag: "🚨",
  alert_assigned: "📋",
  new_comment: "💬",
  new_checkin: "🔔",
};

export default function Notifications() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");
  const utils = trpc.useUtils();

  const isAdminRole =
    user?.role === "admin" ||
    user?.role === "superadmin" ||
    user?.role === "facilitator";

  const { data: notifications, isLoading } = trpc.notifications.getAll.useQuery(undefined, {
    enabled: isAuthenticated && isAdminRole,
    refetchInterval: 30_000,
  });

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  if (!isAuthenticated || !isAdminRole) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.25 0.04 260)" }}>
            Access Restricted
          </h1>
          <p className="text-muted-foreground">
            Notifications are available for admin and facilitator accounts only.
          </p>
        </div>
      </div>
    );
  }

  const filtered = (notifications ?? []).filter((n) =>
    filter === "unread" ? !n.read : true
  );
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.01 260)" }}>
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "oklch(0.25 0.04 260)" }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "unread"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === f
                  ? "text-white"
                  : "bg-white border text-muted-foreground hover:bg-violet-50",
              ].join(" ")}
              style={
                filter === f
                  ? { background: "oklch(0.45 0.18 285)" }
                  : { borderColor: "oklch(0.92 0.03 260)" }
              }
            >
              {f === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            </button>
          ))}
        </div>

        {/* List */}
        <div
          className="rounded-2xl border bg-white overflow-hidden shadow-sm"
          style={{ borderColor: "oklch(0.92 0.03 260)" }}
        >
          {isLoading ? (
            <div className="px-4 py-12 text-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
                style={{ borderColor: "oklch(0.45 0.18 285)", borderTopColor: "transparent" }}
              />
              <p className="text-sm text-muted-foreground">Loading notifications…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-25" />
              <p className="text-sm font-medium text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "oklch(0.95 0.02 260)" }}>
              {filtered.map((n) => (
                <li
                  key={n.id}
                  className={[
                    "flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors hover:bg-violet-50/60",
                    !n.read ? "bg-violet-50/40" : "",
                  ].join(" ")}
                  onClick={() => {
                    if (!n.read) markReadMutation.mutate({ id: n.id });
                    if (n.link) navigate(n.link);
                  }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {TYPE_EMOJI[n.type] ?? "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "text-sm font-semibold",
                        !n.read ? "text-violet-700" : "text-gray-800",
                      ].join(" ")}
                    >
                      {n.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {n.link && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-50" />
                    )}
                    {!n.read && (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: "oklch(0.55 0.22 25)" }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
