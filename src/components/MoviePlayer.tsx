import { useState, useEffect, useCallback, useRef } from "react";
import { WifiOff, CloudDownload, Share2, Check, Plus, Download, ChevronDown, Maximize, Minimize } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { toggleMyList, isInMyList } from "@/hooks/useMyList";
import DownloadSourceSheet from "@/components/DownloadSourceSheet";
import { trackMediaView } from "@/lib/analytics";

const SERVER_PREF_KEY = "bb:player:server";
const EMBED_THEME = "9b5cff";

type ServerKey =
  | "vidbolt"
  | "cinesrc"
  | "vidcore"
  | "vidnest"
  | "vidlink"
  | "vidsrcme"
  | "vidgod"
  | "filmu";

interface Server {
  id: ServerKey;
  label: string;
  base: string;
}

const SERVERS: Server[] = [
  { id: "vidbolt", label: "Cipher", base: "https://vidbolt.xyz" },
  { id: "cinesrc", label: "Nova", base: "https://embed.filmu.in" },
  { id: "vidcore", label: "Crimson", base: "https://vidcore.io" },
  { id: "vidnest", label: "Helix", base: "https://vidnest.fun" },
  { id: "vidlink", label: "Astra", base: "https://vidlink.pro" },
  { id: "vidsrcme", label: "Ironclad", base: "https://vidsrcme.ru" },
  { id: "vidgod", label: "Vale", base: "https://vidgod.site" },
  { id: "filmu", label: "Lumen", base: "https://cinesrc.st" },
];

const embedUrlFor = (base: string, type: "movie" | "tv", tmdbId: string, season: number, episode: number) =>
  type === "tv"
    ? `${base}/tv/${tmdbId}/${season}/${episode}?theme=${EMBED_THEME}`
    : `${base}/movie/${tmdbId}?theme=${EMBED_THEME}`;


// Kept as a legacy type so existing pages that pass `serverId`/`onServerChange`
// still typecheck.
export type ServerId = string;

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
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const online = useOnlineStatus();
  const [server, setServer] = useState<ServerKey>(() => {
    try {
      const saved = localStorage.getItem(SERVER_PREF_KEY) as ServerKey | null;
      if (saved && SERVERS.some((s) => s.id === saved)) return saved;
    } catch {
      /* ignore */
    }
    return "vidbolt";
  });

  const active = SERVERS.find((s) => s.id === server) || SERVERS[0];
  const embedUrl = embedUrlFor(active.base, type, tmdbId, season, episode);

  const pickServer = (id: ServerKey) => {
    setServer(id);
    try {
      localStorage.setItem(SERVER_PREF_KEY, id);
    } catch {
      /* ignore */
    }
  };

  // ---- Fullscreen ----------------------------------------------------------
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> })
      | null;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (el?.requestFullscreen) await el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  // ---- In-player actions: download, share, watchlist -----------------------
  const listItemId = `${type}-${tmdbId}`;
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [inList, setInList] = useState(() => isInMyList(listItemId));

  useEffect(() => {
    setInList(isInMyList(listItemId));
  }, [listItemId]);

  const shareLink = useCallback(async () => {
    const url =
      type === "tv"
        ? `${window.location.origin}/watch/tv/${tmdbId}/${season}/${episode}`
        : `${window.location.origin}/watch/movie/${tmdbId}`;
    const shareTitle = title || "BingBloom";
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url });
        return;
      }
    } catch {
      /* user cancelled — fall through to copying */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — share it to let anyone watch this.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }, [type, tmdbId, season, episode, title]);

  const toggleWatchlist = useCallback(() => {
    const added = toggleMyList({
      id: listItemId,
      title: title || "Untitled",
      thumbnail: poster || backdrop || "",
      channel: type === "tv" ? "TV Show" : "Movie",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    setInList(added);
  }, [listItemId, title, poster, backdrop, type]);

  // Record each movie / episode view exactly once per title change.
  useEffect(() => {
    if (!tmdbId) return;
    trackMediaView({
      type,
      id: String(tmdbId),
      title,
      season: type === "tv" ? season : undefined,
      episode: type === "tv" ? episode : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tmdbId, type, season, episode]);

  if (!online) {
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
        className="relative w-full aspect-video overflow-hidden bb-player-shell bg-black"
      >
        <iframe
          key={embedUrl}
          src={embedUrl}
          title={title ? `Watch ${title}` : "BingBloom player"}
          className="absolute inset-0 w-full h-full border-0 bg-black"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="origin"
        />
      </div>

      {/* Toolbar: server switcher + quick actions */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-background border-t border-border/60 flex-wrap">
        <div className="relative">
          <label className="sr-only" htmlFor="bb-server-select">
            Server
          </label>
          <select
            id="bb-server-select"
            value={server}
            onChange={(e) => pickServer(e.target.value as ServerKey)}
            className="h-9 appearance-none rounded-md border border-border/60 bg-foreground/5 pl-3 pr-8 text-[12px] font-semibold text-foreground"
          >
            {SERVERS.map((s) => (
              <option key={s.id} value={s.id} className="bg-background text-foreground">
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/70" />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <PlayerIconButton label="Download" onClick={() => setDownloadOpen(true)}>
            <Download className="h-4 w-4" />
          </PlayerIconButton>
          <PlayerIconButton
            label={isFull ? "Exit full screen" : "Full screen"}
            onClick={toggleFullscreen}
          >
            {isFull ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </PlayerIconButton>
          <PlayerIconButton label="Share" onClick={shareLink}>
            <Share2 className="h-4 w-4" />
          </PlayerIconButton>
          <PlayerIconButton
            label={inList ? "Remove from watchlist" : "Add to watchlist"}
            onClick={toggleWatchlist}
          >
            {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </PlayerIconButton>
        </div>
      </div>

      <DownloadSourceSheet
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        type={type}
        tmdbId={tmdbId}
        title={title || "Untitled"}
        year={year}
        season={type === "tv" ? season : undefined}
        episode={type === "tv" ? episode : undefined}
        itemId={`${type}-${tmdbId}${type === "tv" ? `-s${season}-e${episode}` : ""}`}
        poster={poster}
        backdrop={backdrop}
      />
    </div>
  );
};

export default MoviePlayer;

/** Circular, glassy icon button used in the player toolbar. */
const PlayerIconButton = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-border/60 text-foreground transition hover:bg-foreground/10 active:scale-95"
  >
    {children}
  </button>
);
