import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Heart, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const NAV_LINKS = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/checkin", label: "Check-In", emoji: "✅" },
  { href: "/compass", label: "Compass", emoji: "🧭" },
  { href: "/resources", label: "Resources", emoji: "📚" },
  { href: "/mindset", label: "Mindset", emoji: "💡" },
  { href: "/zera-cards", label: "Zera Cards", emoji: "🃏" },
  { href: "/coaching", label: "Coaching", emoji: "🎯" },
  { href: "/about", label: "About", emoji: "💜" },
];

export default function NavBar() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { toast.success("Signed out successfully."); navigate("/"); },
  });

  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-black text-xl flex-shrink-0"
          style={{ color: "oklch(0.45 0.18 285)" }}
        >
          <Heart className="w-5 h-5" style={{ fill: "oklch(0.45 0.18 285)" }} />
          HeadCheck
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => navigate(link.href)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: isActive(link.href) ? "oklch(0.95 0.04 285)" : "transparent",
                color: isActive(link.href) ? "oklch(0.45 0.18 285)" : "oklch(0.40 0.04 260)",
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => navigate(user?.role === "facilitator" || user?.role === "superadmin" ? "/facilitator" : "/dashboard")}
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <a
              href={getLoginUrl()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}
            >
              Sign In
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: "oklch(0.45 0.18 285)" }}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t px-4 py-4 space-y-1" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => { navigate(link.href); setMobileOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: isActive(link.href) ? "oklch(0.95 0.04 285)" : "transparent",
                color: isActive(link.href) ? "oklch(0.45 0.18 285)" : "oklch(0.40 0.04 260)",
              }}
            >
              <span>{link.emoji}</span> {link.label}
            </button>
          ))}
          <div className="pt-2 border-t" style={{ borderColor: "oklch(0.92 0.03 260)" }}>
            {isAuthenticated ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 rounded-xl" onClick={() => logoutMutation.mutate()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <a
                href={getLoginUrl()}
                className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.65 0.18 340))" }}
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
