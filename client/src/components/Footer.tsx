import { useLocation } from "wouter";
import { Heart } from "lucide-react";

const FOOTER_LINKS = {
  "Explore": [
    { href: "/checkin", label: "Emotional Check-In" },
    { href: "/compass", label: "Self Trust Compass" },
    { href: "/mindset", label: "Daily Mindset" },
    { href: "/zera-cards", label: "Zera Cards" },
  ],
  "Learn": [
    { href: "/resources", label: "Resource Library" },
    { href: "/learn-ei", label: "Learn EI" },
    { href: "/coaching", label: "Coaching" },
    { href: "/about", label: "About Us" },
  ],
  "For Organizations": [
    { href: "/for-institutions", label: "Schools & Institutions" },
    { href: "/facilitator", label: "Facilitator Dashboard" },
    { href: "/coaching", label: "Team Coaching" },
  ],
};

export default function Footer() {
  const [, navigate] = useLocation();

  return (
    <footer className="border-t mt-16" style={{ background: "oklch(0.10 0.04 260)", borderColor: "oklch(0.18 0.04 260)" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-black text-xl mb-3"
              style={{ color: "oklch(0.85 0.06 285)" }}
            >
              <Heart className="w-5 h-5" style={{ fill: "oklch(0.85 0.06 285)" }} />
              HeadCheck
            </button>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "oklch(0.65 0.03 260)" }}>
              Your supportive space for emotional clarity, grounded in neuroscience and African wisdom.
            </p>
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "oklch(0.18 0.04 260)", color: "oklch(0.60 0.04 260)" }}>
              🆘 Crisis? Call or text <strong className="text-white">988</strong> (Suicide & Crisis Lifeline)
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-semibold mb-3 text-sm" style={{ color: "oklch(0.80 0.04 260)" }}>{section}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <button
                      onClick={() => navigate(link.href)}
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: "oklch(0.55 0.03 260)" }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderColor: "oklch(0.18 0.04 260)" }}>
          <p className="text-xs" style={{ color: "oklch(0.45 0.03 260)" }}>
            © {new Date().getFullYear()} HeadCheck AI. All rights reserved.
          </p>
          <p className="text-xs text-center" style={{ color: "oklch(0.40 0.03 260)" }}>
            HeadCheck AI is a supportive wellness tool, not a substitute for professional mental health care.
          </p>
          <div className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.45 0.03 260)" }}>
            Made with <Heart className="w-3 h-3 mx-0.5" style={{ fill: "oklch(0.65 0.18 340)" }} /> and African wisdom
          </div>
        </div>
      </div>
    </footer>
  );
}
