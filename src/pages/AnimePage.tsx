import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";
import BannerAd468 from "@/components/BannerAd468";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import TmdbRow from "@/components/TmdbRow";
import InlineAdRow from "@/components/InlineAdRow";
import { fetchList, type TmdbItem } from "@/lib/tmdb";

// 25 anime category rows powered by TMDB discover (genre 16 + Japanese origin + keywords).
const ROWS: { title: string; params: Record<string, string> }[] = [
  { title: "Trending Anime", params: { sort_by: "popularity.desc" } },
  { title: "Top Rated", params: { sort_by: "vote_average.desc", "vote_count.gte": "200" } },
  { title: "New Releases", params: { sort_by: "first_air_date.desc", "first_air_date.lte": new Date().toISOString().slice(0, 10) } },
  { title: "Action & Adventure", params: { with_genres: "16,10759" } },
  { title: "Romance", params: { with_genres: "16,10749" } },
  { title: "Fantasy", params: { with_genres: "16,10765" } },
  { title: "Comedy", params: { with_genres: "16,35" } },
  { title: "Drama", params: { with_genres: "16,18" } },
  { title: "Mystery", params: { with_genres: "16,9648" } },
  { title: "Sci-Fi", params: { with_genres: "16,10765" } },
  { title: "Slice of Life", params: { with_keywords: "210024" } },
  { title: "Supernatural", params: { with_keywords: "6152" } },
  { title: "Mecha", params: { with_keywords: "4344" } },
  { title: "Isekai", params: { with_keywords: "246716" } },
  { title: "Magic", params: { with_keywords: "2343" } },
  { title: "School Life", params: { with_keywords: "6270" } },
  { title: "Music", params: { with_genres: "16,10402" } },
  { title: "Kids & Family", params: { with_genres: "16,10762" } },
  { title: "Martial Arts", params: { with_keywords: "5565" } },
  { title: "Cyberpunk", params: { with_keywords: "12190" } },
  { title: "Horror", params: { with_genres: "16,9648", with_keywords: "10292" } },
  { title: "Sports Anime", params: { with_keywords: "6075" } },
  { title: "Historical", params: { with_genres: "16,36" } },
  { title: "Shounen", params: { with_keywords: "210024" } },
  { title: "Shoujo", params: { with_keywords: "13141" } },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function useAnimeRow(title: string, params: Record<string, string>) {
  return useQuery<TmdbItem[]>({
    queryKey: ["anime", "row", title],
    queryFn: () => {
      const qs = new URLSearchParams({
        sort_by: "popularity.desc",
        with_genres: "16",
        with_original_language: "ja",
        include_adult: "false",
        ...params,
      });
      return fetchList(`/discover/tv?${qs.toString()}`, "tv");
    },
    staleTime: 1000 * 60 * 30,
  });
}

const AnimeRow = ({ title, params }: { title: string; params: Record<string, string> }) => {
  const { data, isLoading } = useAnimeRow(title, params);
  return <TmdbRow title={title} items={data} isLoading={isLoading} type="tv" />;
};

const NOW_ANIME_URL = "https://nowanime.lovable.app";

/** One-time-per-session dialog telling users anime moved to NowAnime. */
const NowAnimeDialog = () => {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem("bb-nowanime-dialog") !== "1";
    } catch {
      return true;
    }
  });

  const close = () => {
    try {
      sessionStorage.setItem("bb-nowanime-dialog", "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? close() : setOpen(true))}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Anime has moved to NowAnime</DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed">
            We've moved our anime operations to a curated site built just for anime —
            a bigger library, faster streams and subs or dubs. Watch it all on NowAnime.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-1">
          <a
            href={NOW_ANIME_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("external_app_dialog_click", { destination: NOW_ANIME_URL, source: "anime" });
              close();
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground"
          >
            Open NowAnime <ArrowUpRight className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={close}
            className="min-h-[40px] rounded-xl text-[12.5px] font-semibold text-muted-foreground hover:bg-foreground/5"
          >
            Stay on CloudPie
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AnimePage = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };
  return (
    <AppLayout>
      <NowAnimeDialog />
      <SEO
        title="Anime – CloudPie"
        description="25 anime collections — trending, top-rated, isekai, mecha, romance, slice of life, sports and more. Stream anime free."
      />
      <div className="px-[4%] pt-8 md:pt-12 pb-6 border-b border-border/60">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Curated animation</p>
        <h1 className="mt-1 font-display text-4xl md:text-6xl text-foreground">Anime</h1>
        <p className="text-sm text-muted-foreground mt-2">25 hand-picked collections</p>
      </div>

      <div className="px-3 pb-1">
        <BannerAd468 />
      </div>

      <InlineAdRow count={4} />

      {/* Sticky category menu */}
      <div className="sticky top-12 md:top-14 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div
          ref={scrollerRef}
          className="flex gap-1.5 overflow-x-auto scrollbar-hide px-[4%] py-2.5"
        >
          {ROWS.map((r) => (
            <button
              key={r.title}
              onClick={() => scrollTo(`anime-${slugify(r.title)}`)}
              className="flex-shrink-0 px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-[0.08em] font-medium whitespace-nowrap bg-secondary text-foreground/80 hover:bg-primary hover:text-primary-foreground border border-border transition"
            >
              {r.title}
            </button>
          ))}
        </div>
      </div>

      {ROWS.map((r, i) => (
        <div key={r.title} id={`anime-${slugify(r.title)}`} className="scroll-mt-28">
          <AnimeRow title={r.title} params={r.params} />
          {(i === 4 || i === 10 || i === 16 || i === 21) && <InlineAdRow />}
        </div>
      ))}
    </AppLayout>
  );
};

export default AnimePage;
