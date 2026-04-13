import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart, Menu, X, LayoutDashboard, LogOut, ChevronDown, User,
  CheckCircle2, Circle, ArrowRight, ChevronUp, Loader2, Shield,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useNavProgress, type StepStatus } from "@/contexts/NavProgressContext";

const NAV_LINKS = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/checkin", label: "Check-In", emoji: "✅" },
  { href: "/compass", label: "Compass", emoji: "🧭" },
  { href: "/ei-quiz", label: "EI Quiz", emoji: "🧠" },
  { href: "/resources", label: "Resources", emoji: "📚" },
  { href: "/mindset", label: "Mindset", emoji: "💡" },
  { href: "/zera-cards", label: "Zera Cards", emoji: "🃏" },
  { href: "/coaching", label: "Coaching", emoji: "🎯" },
  { href: "/about", label: "About", emoji: "💜" },
];

/** Returns the initials (up to 2 chars) from a display name or email */
function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return "HC";
}

/** Step status icon */
function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done")
    return <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.55 0.18 160)" }} />;
  if (status === "current")
    return (
      <span
        className="w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
        style={{ borderColor: "oklch(0.45 0.18 285)", background: "oklch(0.95 0.04 285)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.45 0.18 285)" }} />
      </span>
    );
  return <Circle className="w-4 h-4 flex-shrink-0 text-muted-foreground opacity-40" />;
}

export default function NavBar() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false); // controls DOM presence
  const summaryRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelInnerRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const { progress } = useNavProgress();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("You've been signed out.", { description: "See you soon on HeadCheck!" });
      navigate("/");
    },
    onError: () => {
      toast.error("Sign-out failed. Please try again.");
    },
  });

  const handleLogout = () => logoutMutation.mutate();
  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  const dashboardPath =
    user?.role === "facilitator" || user?.role === "superadmin" ? "/facilitator" : "/dashboard";

  const initials = getInitials(user?.name, user?.email);

  // Compute progress percentage (0–100)
  const pct = progress.active && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  // Animate panel open/close using max-height + opacity
  useEffect(() => {
    const panel = panelRef.current;
    const inner = panelInnerRef.current;
    if (!panel || !inner) return;
    if (summaryOpen) {
      setSummaryVisible(true);
      // Let DOM render first, then animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panel.style.maxHeight = inner.scrollHeight + "px";
          panel.style.opacity = "1";
          panel.style.transform = "translateY(0)";
        });
      });
    } else {
      panel.style.maxHeight = "0px";
      panel.style.opacity = "0";
      panel.style.transform = "translateY(-8px)";
      // Remove from DOM after transition ends
      const tid = setTimeout(() => setSummaryVisible(false), 280);
      return () => clearTimeout(tid);
    }
  }, [summaryOpen]);

  // Close summary panel on outside click or Escape
  useEffect(() => {
    if (!summaryOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSummaryOpen(false); };
    const handleClick = (e: MouseEvent) => {
      if (summaryRef.current && !summaryRef.current.contains(e.target as Node)) {
        setSummaryOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [summaryOpen]);

  // Close summary when progress clears
  useEffect(() => {
    if (!progress.active) setSummaryOpen(false);
  }, [progress.active]);

  // Recalculate max-height when steps change while panel is open
  const recalcHeight = useCallback(() => {
    const panel = panelRef.current;
    const inner = panelInnerRef.current;
    if (panel && inner && summaryOpen) {
      panel.style.maxHeight = inner.scrollHeight + "px";
    }
  }, [summaryOpen]);
  useEffect(() => { recalcHeight(); }, [progress.steps, recalcHeight]);

  /** The clickable progress widget (bar + label + counter) */
  const ProgressWidget = ({ mobile = false }: { mobile?: boolean }) => (
    <button
      onClick={() => progress.steps.length > 0 && setSummaryOpen((o) => !o)}
      className={[
        "flex items-center gap-2 rounded-xl transition-colors",
        mobile ? "w-full px-0 py-1" : "flex-1 px-2 py-1 hover:bg-violet-50",
        progress.steps.length > 0 ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
      aria-expanded={summaryOpen}
      aria-haspopup={progress.steps.length > 0 ? "true" : undefined}
      aria-label={`${progress.label} — step ${progress.current} of ${progress.total}. ${progress.steps.length > 0 ? "Click to view step summary." : ""}`}
      title={progress.steps.length > 0 ? "View step summary" : undefined}
    >
      {/* Journey label */}
      <span
        className="text-xs font-semibold whitespace-nowrap"
        style={{ color: "oklch(0.45 0.18 285)" }}
      >
        {progress.label}
      </span>

      {/* Progress track */}
      <div
        className={["rounded-full overflow-hidden flex-1", mobile ? "h-1.5" : "h-2"].join(" ")}
        style={{ background: "oklch(0.93 0.03 285)" }}
        role="progressbar"
        aria-valuenow={progress.current}
        aria-valuemin={0}
        aria-valuemax={progress.total}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: progress.color }}
        />
      </div>

      {/* Step counter */}
      <span
        className="text-xs font-medium whitespace-nowrap tabular-nums"
        style={{ color: "oklch(0.40 0.04 260)" }}
      >
        {progress.current}/{progress.total}
      </span>

      {/* Toggle chevron when steps available */}
      {progress.steps.length > 0 && (
        <span aria-hidden="true" className="text-muted-foreground">
          {summaryOpen
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      )}
    </button>
  );

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b"
      style={{ borderColor: "oklch(0.92 0.03 260)" }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ── Main bar ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-black text-xl flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
          style={{ color: "oklch(0.45 0.18 285)" }}
          aria-label="HeadCheck — Back to home"
        >
          <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
          <span>HeadCheck</span>
        </button>

        {/* Desktop nav links — hidden when progress bar is active */}
        {!progress.active && (
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                style={{
                  background: isActive(link.href) ? "oklch(0.95 0.04 285)" : "transparent",
                  color: isActive(link.href) ? "oklch(0.45 0.18 285)" : "oklch(0.40 0.04 260)",
                }}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* Desktop progress widget — shown when active */}
        {progress.active && (
          <div className="hidden lg:flex items-center flex-1 mx-4" ref={summaryRef}>
            <ProgressWidget />
          </div>
        )}

        {/* Right side — desktop */}
        <div className="hidden lg:flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-violet-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-label="User menu"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <span
                    className="hidden xl:block text-sm font-medium max-w-[120px] truncate"
                    style={{ color: "oklch(0.25 0.04 260)" }}
                  >
                    {user?.name ?? user?.email ?? "My account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                <DropdownMenuLabel className="pb-1">
                  <p className="text-sm font-semibold truncate">{user?.name ?? "My account"}</p>
                  {user?.email && (
                    <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
                  )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2 text-violet-500" aria-hidden="true" />
                  My Dashboard
                </DropdownMenuItem>
                {(user?.role === "admin" || user?.role === "superadmin" || user?.role === "facilitator") && (
                  <DropdownMenuItem
                    onClick={() => navigate("/facilitator")}
                    className="cursor-pointer rounded-lg text-purple-600 focus:text-purple-700 focus:bg-purple-50"
                  >
                    <Shield className="w-4 h-4 mr-2 text-purple-500" aria-hidden="true" />
                    Facilitator View
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer rounded-lg"
                >
                  <User className="w-4 h-4 mr-2 text-muted-foreground" aria-hidden="true" />
                  My Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                  aria-label="Sign out of HeadCheck"
                >
                  <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span>{logoutMutation.isPending ? "Signing out…" : "Sign Out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg font-medium focus-visible:ring-2 focus-visible:ring-violet-500"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="rounded-lg font-semibold text-white focus-visible:ring-2 focus-visible:ring-violet-500"
                style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}
                onClick={() => navigate("/register")}
              >
                Get Started Free
              </Button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: "oklch(0.45 0.18 285)" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile progress widget ─────────────────────────────── */}
      {progress.active && (
        <div className="lg:hidden px-4 pb-2" ref={summaryRef}>
          <ProgressWidget mobile />
        </div>
      )}

      {/* ── Full-width progress strip (desktop bottom line) ──── */}
      {progress.active && (
        <div
          className="hidden lg:block h-0.5 w-full"
          style={{ background: "oklch(0.93 0.03 285)" }}
        >
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, background: progress.color }}
          />
        </div>
      )}

      {/* ── Step Summary Panel (animated dropdown below NavBar) ── */}
      {summaryVisible && progress.steps.length > 0 && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full z-40 bg-white border-b shadow-xl overflow-hidden"
          style={{
            borderColor: "oklch(0.92 0.03 260)",
            maxHeight: "0px",
            opacity: 0,
            transform: "translateY(-8px)",
            transition: "max-height 280ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease, transform 220ms ease",
          }}
          role="region"
          aria-label="Journey step summary"
        >
          <div ref={panelInnerRef} className="max-w-3xl mx-auto px-4 py-4">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: "oklch(0.25 0.04 260)" }}>
                {progress.label} — Step Summary
              </h2>
              <button
                onClick={() => setSummaryOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                aria-label="Close summary"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Loading state */}
            {progress.isLoadingSteps ? (
              <div
                className="flex flex-col items-center justify-center gap-3 py-8"
                role="status"
                aria-label="Loading steps"
              >
                <Loader2
                  className="w-7 h-7 animate-spin"
                  style={{ color: "oklch(0.55 0.18 285)" }}
                  aria-hidden="true"
                />
                <p className="text-xs" style={{ color: "oklch(0.55 0.04 260)" }}>
                  Loading steps…
                </p>
              </div>
            ) : (
              /* Step list — responsive grid */
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-label="Step list">
                {progress.steps.map((step, idx) => (
                  <li
                    key={step.id}
                    className={[
                      "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-colors",
                      step.status === "current"
                        ? "border-violet-300 bg-violet-50"
                        : step.status === "done"
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-gray-100 bg-gray-50/60",
                    ].join(" ")}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <span className="mt-0.5">
                      <StepIcon status={step.status} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-semibold leading-tight"
                        style={{
                          color: step.status === "upcoming"
                            ? "oklch(0.60 0.02 260)"
                            : "oklch(0.25 0.04 260)",
                        }}
                      >
                        {idx + 1}. {step.label}
                      </p>
                      {step.description && (
                        <p
                          className="text-xs mt-0.5 leading-snug line-clamp-2"
                          style={{ color: "oklch(0.50 0.03 260)" }}
                        >
                          {step.description}
                        </p>
                      )}
                    </div>
                    {step.status === "current" && (
                      <ArrowRight
                        className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                        style={{ color: "oklch(0.45 0.18 285)" }}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                ))}
              </ol>
            )}

            {/* Progress summary footer */}
            <div
              className="mt-3 pt-3 border-t flex items-center justify-between text-xs"
              style={{ borderColor: "oklch(0.92 0.03 260)" }}
            >
              <span style={{ color: "oklch(0.50 0.03 260)" }}>
                <span>{progress.steps.filter((s) => s.status === "done").length} step{progress.steps.filter((s) => s.status === "done").length !== 1 ? "s" : ""} completed</span>
              </span>
              <span className="font-semibold" style={{ color: "oklch(0.45 0.18 285)" }}>
                <span>{pct}% of journey</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden bg-white border-t px-4 py-4 space-y-1"
          style={{ borderColor: "oklch(0.92 0.03 260)" }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => { navigate(link.href); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              style={{
                background: isActive(link.href) ? "oklch(0.95 0.04 285)" : "transparent",
                color: isActive(link.href) ? "oklch(0.45 0.18 285)" : "oklch(0.40 0.04 260)",
              }}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              <span aria-hidden="true">{link.emoji}</span><span>{link.label}</span>
            </button>
          ))}

          <div className="pt-2 border-t" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-violet-50">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "oklch(0.25 0.04 260)" }}>
                      {user?.name ?? "My account"}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => { navigate(dashboardPath); setMobileOpen(false); }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 focus-visible:ring-red-400"
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    disabled={logoutMutation.isPending}
                    aria-label="Sign out of HeadCheck"
                  >
                    <LogOut className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    <span>{logoutMutation.isPending ? "…" : "Sign Out"}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl"
                  onClick={() => { navigate("/login"); setMobileOpen(false); }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="w-full rounded-xl font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}
                  onClick={() => { navigate("/register"); setMobileOpen(false); }}
                >
                  Get Started Free
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
