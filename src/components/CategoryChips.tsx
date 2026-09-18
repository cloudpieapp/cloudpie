import { Link, useLocation } from "react-router-dom";

const chips = [
  { to: "/home", label: "Trending" },
  { to: "/movies", label: "Movies" },
  { to: "/tv", label: "TV" },
  { to: "/anime", label: "Anime" },
  { to: "/animation", label: "Animation" },
  { to: "/documentary", label: "Docs" },
  { to: "/live-tv", label: "Live" },
  { to: "/genre/comedy", label: "Comedy" },
  { to: "/genre/action", label: "Action" },
  { to: "/genre/horror", label: "Horror" },
  { to: "/my-downloads", label: "Downloads" },
];

/** Horizontal scrollable chip bar — matches the reference mockups (image 7/13). */
const CategoryChips = () => {
  const { pathname } = useLocation();
  return (
    <div className="sticky top-12 md:top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border/60">
      <div className="flex gap-2 overflow-x-auto px-[4%] py-2.5 scrollbar-hide">
        {chips.map((c) => {
          const active = pathname === c.to;
          return (
            <Link
              key={c.to}
              to={c.to}
              className={`shrink-0 rounded-sm border px-3 py-1 text-[10px] uppercase tracking-[0.08em] font-medium whitespace-nowrap transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary/70 text-foreground/70 hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChips;
