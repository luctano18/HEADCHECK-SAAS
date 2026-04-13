import { useState } from "react";
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
import { Heart, Menu, X, LayoutDashboard, LogOut, ChevronDown, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useNavProgress } from "@/contexts/NavProgressContext";

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

export default function NavBar() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const utils = trpc.useUtils();
  const { progress } = useNavProgress();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Vous avez été déconnecté.", { description: "À bientôt sur HeadCheck !" });
      navigate("/");
    },
    onError: () => {
      toast.error("Erreur lors de la déconnexion. Veuillez réessayer.");
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

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b"
      style={{ borderColor: "oklch(0.92 0.03 260)" }}
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* ── Main bar ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-black text-xl flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
          style={{ color: "oklch(0.45 0.18 285)" }}
          aria-label="HeadCheck — Retour à l'accueil"
        >
          <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
          HeadCheck
        </button>

        {/* Desktop nav links — hidden when progress bar is active to give more space */}
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

        {/* Progress label — shown when active (replaces nav links on desktop) */}
        {progress.active && (
          <div className="hidden lg:flex items-center gap-3 flex-1 mx-6">
            {/* Journey label */}
            <span
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: "oklch(0.45 0.18 285)" }}
            >
              {progress.label}
            </span>

            {/* Progress track */}
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "oklch(0.93 0.03 285)" }}
              role="progressbar"
              aria-valuenow={progress.current}
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-label={`${progress.label} — étape ${progress.current} sur ${progress.total}`}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  background: progress.color,
                }}
              />
            </div>

            {/* Step counter */}
            <span
              className="text-sm font-medium whitespace-nowrap tabular-nums"
              style={{ color: "oklch(0.40 0.04 260)" }}
            >
              {progress.current} / {progress.total}
            </span>
          </div>
        )}

        {/* Right side — desktop */}
        <div className="hidden lg:flex items-center gap-2">
          {isAuthenticated ? (
            /* ── User dropdown menu ─────────────────────────────────── */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-violet-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-label="Menu utilisateur"
                >
                  {/* Avatar with initials */}
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  {/* Name (truncated) */}
                  <span
                    className="hidden xl:block text-sm font-medium max-w-[120px] truncate"
                    style={{ color: "oklch(0.25 0.04 260)" }}
                  >
                    {user?.name ?? user?.email ?? "Mon compte"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                {/* User info header */}
                <DropdownMenuLabel className="pb-1">
                  <p className="text-sm font-semibold truncate">{user?.name ?? "Mon compte"}</p>
                  {user?.email && (
                    <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
                  )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Dashboard */}
                <DropdownMenuItem
                  onClick={() => navigate(dashboardPath)}
                  className="cursor-pointer rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2 text-violet-500" aria-hidden="true" />
                  Tableau de bord
                </DropdownMenuItem>

                {/* Profile */}
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer rounded-lg"
                >
                  <User className="w-4 h-4 mr-2 text-muted-foreground" aria-hidden="true" />
                  Mon profil
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Sign Out — visually distinct */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                  aria-label="Se déconnecter de HeadCheck"
                >
                  <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                  {logoutMutation.isPending ? "Déconnexion…" : "Se déconnecter"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* ── Guest buttons ──────────────────────────────────────── */
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
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Progress bar (mobile) — thin strip below main bar ─────── */}
      {progress.active && (
        <div className="lg:hidden px-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "oklch(0.45 0.18 285)" }}>
              {progress.label}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
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
            <span className="text-xs tabular-nums" style={{ color: "oklch(0.50 0.04 260)" }}>
              {progress.current}/{progress.total}
            </span>
          </div>
        </div>
      )}

      {/* ── Full-width progress strip (desktop, thin line at bottom of nav) ── */}
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
              <span aria-hidden="true">{link.emoji}</span> {link.label}
            </button>
          ))}

          <div className="pt-2 border-t" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            {isAuthenticated ? (
              <div className="space-y-2">
                {/* User info strip */}
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
                      {user?.name ?? "Mon compte"}
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
                  {/* Logout button — red, prominent */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 focus-visible:ring-red-400"
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    disabled={logoutMutation.isPending}
                    aria-label="Se déconnecter de HeadCheck"
                  >
                    <LogOut className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    {logoutMutation.isPending ? "…" : "Sign Out"}
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
