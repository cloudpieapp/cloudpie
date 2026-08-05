import { Home, Film, Flame, Drama, Podcast, Library } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/home", icon: Home, label: "Home", match: (p: string) => p === "/" || p === "/home" },
  { to: "/search", icon: Flame, label: "Explore", match: (p: string) => p.startsWith("/search") },
  { to: "/movies", icon: Film, label: "Movies", match: (p: string) => p.startsWith("/movies") || p.startsWith("/tv") },
  { to: "/anime", icon: Drama, label: "Anime", match: (p: string) => p.startsWith("/anime") },
  { to: "/live-tv", icon: Podcast, label: "Live", match: (p: string) => p.startsWith("/live-tv") },
  { to: "/library", icon: Library, label: "Library", match: (p: string) => p.startsWith("/library") || p.startsWith("/my-downloads") || p.startsWith("/download") },
];


const BottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-white/5 bg-black/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex items-stretch justify-between px-1.5">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1 min-w-0">
              <Link
                to={t.to}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 text-[11px] font-medium transition ${
                  active ? "text-[#E50914]" : "text-white/60"
                }`}
              >
                <Icon className="h-[24px] w-[24px]" strokeWidth={active ? 2.4 : 1.8} />
                <span className="truncate max-w-full">{t.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-[#E50914]" />
                )}

              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
