import { useState, useEffect, useRef, useCallback } from "react";
import { Expand, WifiOff, CloudDownload, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isDownloaded } from "@/lib/offlineDownloads";
import DownloadButton from "@/components/DownloadButton";
import PlayerBrandLoader from "@/components/PlayerBrandLoader";
import {
  resolveMovieboxDownloads,
  movieboxProxyUrl,
  resolutionLabel,
  type MovieboxDownload,
} from "@/lib/moviebox";
import { getSetting } from "@/hooks/useSettings";

const QUALITY_PREF_KEY = "bb:mb:quality-pref";

// Kept as a legacy type so existing pages that pass `serverId`/`onServerChange`
// still typecheck. The value is ignored — MovieBox is the only source now.
export type ServerId = "moviebox";

interface Props {
  tmdbId: string;
  type?: "movie" | "tv";
  season?: number;
  episode?: number;
  serverId?: ServerId;
  onServerChange?: (id: ServerId) => void;
  title?: string;
  year?: string;
  poster?: string | null;
  backdrop?: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  nextItem?: { title: string; poster?: string | null; subtitle?: string } | null;
}

const MoviePlayer = ({
  tmdbId,
  type = "movie",
  season = 1,
  episode = 1,
  title,
  year,
  poster,
  backdrop,
  onNext,
  nextItem,
}: Props) => {
  const [phase, setPhase] = useState<"loading" | "select" | "playing" | "error">("loading");
  const [downloads, setDownloads] = useState<MovieboxDownload[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const [ended, setEnded] = useState(false);
  const [errorReason, setErrorReason] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const online = useOnlineStatus();
  const [savedOffline, setSavedOffline] = useState(false);

  useEffect(() => {
    let active = true;
    isDownloaded(`${type}-${tmdbId}`).then((d) => {
      if (active) setSavedOffline(d);
    });
    return () => {
      active = false;
    };
  }, [type, tmdbId]);

  // Resolve MovieBox stream URLs whenever the title / episode changes.
  useEffect(() => {
    if (!title) return;
    let active = true;
    setPhase("loading");
    setDownloads([]);
    setSelectedUrl("");
    setEnded(false);
    setErrorReason("");
    (async () => {
      const res = await resolveMovieboxDownloads({
        title,
        year,
        mediaType: type,
        season: type === "tv" ? season : 0,
        episode: type === "tv" ? episode : 0,
      });
      if (!active) return;
      if (!res.ok || !res.downloads || res.downloads.length === 0) {
        setErrorReason(res.reason || "No stream available.");
        setPhase("error");
        return;
      }
      setDownloads(res.downloads);
      setPhase("select");
    })();
    return () => {
      active = false;
    };
  }, [title, year, type, tmdbId, season, episode]);

  const pickQuality = useCallback((d: MovieboxDownload) => {
    setSelectedUrl(movieboxProxyUrl(d.url));
    try {
      localStorage.setItem(QUALITY_PREF_KEY, String(d.resolution));
    } catch {
      /* ignore */
    }
    setPhase("playing");
  }, []);

  // Auto-pick the user's preferred quality (or best available) so autoplay
  // → next episode / next movie doesn't stop on the picker.
  useEffect(() => {
    if (phase !== "select" || downloads.length === 0) return;
    if (!getSetting("autoplay")) return;
    let pref = 0;
    try {
      pref = Number(localStorage.getItem(QUALITY_PREF_KEY) || 0);
    } catch {
      /* ignore */
    }
    const match = pref
      ? downloads
          .slice()
          .sort((a, b) => Math.abs(a.resolution - pref) - Math.abs(b.resolution - pref))[0]
      : downloads[0];
    if (match) pickQuality(match);
  }, [phase, downloads, pickQuality]);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
        try {
          const orientation = (screen as any).orientation;
          if (orientation && typeof orientation.lock === "function") {
            await orientation.lock("landscape").catch(() => {});
          }
        } catch {
          /* ignore */
        }
      } else {
        try {
          (screen as any).orientation?.unlock?.();
        } catch {
          /* ignore */
        }
        await document.exitFullscreen?.();
      }
    } catch {
      /* fullscreen not permitted */
    }
  };

  // Keyboard shortcuts: F fullscreen, Esc exit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!online && !savedOffline) {
    return (
      <div className="w-full bg-background">
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
            <WifiOff className="h-6 w-6 text-foreground/70" />
          </div>
          <p className="text-foreground text-sm font-semibold">You're offline</p>
          <p className="text-muted-foreground text-xs max-w-xs leading-relaxed">
            Connect to the internet to stream this title — or download movies while
            online to watch them anytime, even offline.
          </p>
          <Link
            to="/my-downloads"
            className="mt-1 inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[11px] font-semibold text-primary-foreground bg-primary"
          >
            <CloudDownload className="h-3.5 w-3.5" /> Go to Downloads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      <div
        ref={containerRef}
        tabIndex={-1}
        className="relative w-full aspect-video overflow-hidden bb-player-shell outline-none bg-black"
        style={{ contain: "layout paint" }}
      >
        {/* Native video player once a quality has been picked */}
        {phase === "playing" && selectedUrl && (
          <video
            ref={videoRef}
            key={selectedUrl}
            src={selectedUrl}
            poster={backdrop || poster || undefined}
            className="absolute inset-0 w-full h-full bg-black"
            controls
            autoPlay
            playsInline
            controlsList="nodownload"
            onEnded={() => setEnded(true)}
          />
        )}

        {/* Loading state: backdrop + title metadata + 3-dot animation */}
        {phase === "loading" && (
          <MetadataLoader title={title} year={year} backdrop={backdrop} poster={poster} />
        )}

        {/* Quality selector shown before playback starts */}
        {phase === "select" && (
          <QualitySelector
            downloads={downloads}
            backdrop={backdrop}
            poster={poster}
            title={title}
            year={year}
            onPick={pickQuality}
          />
        )}

        {/* Coming-soon / error state */}
        {phase === "error" && (
          <PlayerBrandLoader variant="coming-soon" label="Coming soon" />
        )}

        {/* Up Next card — only shows once we detect the video actually ended */}
        {ended && nextItem && onNext && (
          <UpNextCard item={nextItem} onNext={onNext} />
        )}
      </div>

      {/* Toolbar: Download + Fullscreen */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-background border-t border-border/60 flex-wrap">
        <div className="flex items-center gap-1.5 ml-auto">
          {title && (
            <DownloadButton
              size="sm"
              type={type}
              tmdbId={tmdbId}
              title={title}
              year={year}
              poster={poster}
              backdrop={backdrop}
              season={type === "tv" ? season : undefined}
              episode={type === "tv" ? episode : undefined}
            />
          )}
          <button
            onClick={toggleFullscreen}
            title="Fullscreen (F)"
            aria-label="Fullscreen"
            className="grid place-items-center h-7 w-7 rounded-md text-foreground hover:bg-foreground/10 border border-border/60"
          >
            <Expand className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading overlay: backdrop of the movie/episode in the background with the
// title, year and a bouncing three-dot animation on top. Shown while the
// MovieBox resolver is running.
const MetadataLoader = ({
  title,
  year,
  backdrop,
  poster,
}: {
  title?: string;
  year?: string;
  backdrop?: string | null;
  poster?: string | null;
}) => {
  const bg = backdrop || poster;
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6 text-center"
      style={{
        background: bg
          ? `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(${bg}) center/cover no-repeat`
          : "#0A0A0A",
      }}
    >
      {title && (
        <div>
          <p className="text-white text-sm sm:text-base font-bold tracking-tight line-clamp-2">
            {title}
          </p>
          {year && <p className="text-white/60 text-[10.5px] mt-0.5">{year}</p>}
        </div>
      )}
      <div className="flex items-center gap-1.5 mt-1" aria-label="Loading">
        <span className="bb-dot" style={{ animationDelay: "0ms" }} />
        <span className="bb-dot" style={{ animationDelay: "160ms" }} />
        <span className="bb-dot" style={{ animationDelay: "320ms" }} />
      </div>
      <p className="text-white/70 text-[10.5px] font-semibold tracking-wide">
        Preparing stream…
      </p>
      <style>{`
        .bb-dot {
          width: 7px; height: 7px; border-radius: 9999px;
          background: #E50914;
          box-shadow: 0 0 12px rgba(229,9,20,0.6);
          animation: bb-bounce 1s infinite ease-in-out both;
          display: inline-block;
        }
        @keyframes bb-bounce {
          0%, 80%, 100% { transform: translateY(0) scale(0.85); opacity: 0.55; }
          40% { transform: translateY(-6px) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Quality selector shown before playback starts. Filters to 1080p/720p/480p
// when present; falls back to whatever MovieBox returned. Never shows file
// sizes per product requirement.
const QualitySelector = ({
  downloads,
  backdrop,
  poster,
  title,
  year,
  onPick,
}: {
  downloads: MovieboxDownload[];
  backdrop?: string | null;
  poster?: string | null;
  title?: string;
  year?: string;
  onPick: (d: MovieboxDownload) => void;
}) => {
  const bg = backdrop || poster;
  const preferred = [1080, 720, 480];
  // Pick best match per preferred rung, fall back to whatever exists.
  const options: MovieboxDownload[] = [];
  for (const rung of preferred) {
    const match = downloads
      .filter((d) => Math.abs(d.resolution - rung) <= 60)
      .sort((a, b) => Math.abs(a.resolution - rung) - Math.abs(b.resolution - rung))[0];
    if (match && !options.includes(match)) options.push(match);
  }
  if (options.length === 0) options.push(...downloads.slice(0, 3));

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{
        background: bg
          ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.9)), url(${bg}) center/cover no-repeat`
          : "#0A0A0A",
      }}
    >
      {title && (
        <div className="max-w-md">
          <p className="text-white text-sm sm:text-base font-bold tracking-tight line-clamp-2">
            {title}
          </p>
          {year && <p className="text-white/60 text-[10.5px] mt-0.5">{year}</p>}
        </div>
      )}
      <p className="text-white/70 text-[10.5px] font-semibold uppercase tracking-[0.14em]">
        Choose quality
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm">
        {options.map((d) => (
          <button
            key={d.url}
            onClick={() => onPick(d)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white transition hover:scale-105"
            style={{
              background: "rgba(229,9,20,0.9)",
              boxShadow: "0 0 18px rgba(229,9,20,0.45)",
            }}
          >
            <Play className="w-3 h-3 fill-white" />
            {resolutionLabel(d.resolution)}
          </button>
        ))}
      </div>
    </div>
  );
};

const UpNextCard = ({
  item,
  onNext,
}: {
  item: { title: string; poster?: string | null; subtitle?: string };
  onNext: () => void;
}) => {
  const [n, setN] = useState(5);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (n <= 0) {
      onNext();
      return;
    }
    const t = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [n, onNext]);

  if (dismissed) return null;

  return (
    <div
      className="absolute bottom-3 right-3 z-30 flex items-center gap-2 rounded-lg p-2 pointer-events-auto max-w-[260px]"
      style={{ background: "rgba(10,10,10,0.92)", border: "1px solid rgba(229,9,20,0.5)", backdropFilter: "blur(8px)" }}
    >
      {item.poster && (
        <img src={item.poster} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[#E50914]">Up Next in {n}s</p>
        <p className="text-[11px] font-semibold text-white truncate">{item.title}</p>
        {item.subtitle && <p className="text-[9px] text-white/50 truncate">{item.subtitle}</p>}
        <div className="flex gap-1 mt-1">
          <button
            onClick={() => onNext()}
            className="text-[9.5px] font-semibold text-white px-2 py-0.5 rounded bg-primary"
          >
            Play now
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-[9.5px] text-white/70 px-1.5 py-0.5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;
