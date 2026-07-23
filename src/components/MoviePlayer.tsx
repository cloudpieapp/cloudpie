import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Expand, WifiOff, CloudDownload, Play, Settings, Subtitles } from "lucide-react";
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
  type MovieboxCaption,
} from "@/lib/moviebox";
import { getSetting } from "@/hooks/useSettings";
import { getResume, setResume, resumeIdFor } from "@/lib/resumePositions";
import PlayerGestureLayer from "@/components/PlayerGestureLayer";

const QUALITY_PREF_KEY = "bb:mb:quality-pref";
const SUBTITLE_PREF_KEY = "bb:mb:subtitle-pref";

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
  const [captions, setCaptions] = useState<MovieboxCaption[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const [selectedRes, setSelectedRes] = useState<number>(0);
  const [subtitleLang, setSubtitleLang] = useState<string>("off");
  const [subtitleVttUrl, setSubtitleVttUrl] = useState<string>("");
  const [ended, setEnded] = useState(false);
  const [errorReason, setErrorReason] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAtRef = useRef<number>(0);
  const online = useOnlineStatus();
  const [savedOffline, setSavedOffline] = useState(false);

  // Stable resume-position key for this movie / episode.
  const resumeKey = useMemo(
    () => resumeIdFor({ type: type === "anime" ? "tv" : type, tmdbId, season, episode }),
    [type, tmdbId, season, episode],
  );

  // Seed the resume point from storage so first-play jumps back to where the
  // user left off, even after a device restart.
  useEffect(() => {
    const saved = getResume(resumeKey);
    if (saved > 15) resumeAtRef.current = saved;
  }, [resumeKey]);

  // Periodically persist current position while playing so accidental closes
  // don't lose progress.
  useEffect(() => {
    if (phase !== "playing") return;
    const iv = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused || !v.currentTime) return;
      setResume(resumeKey, v.currentTime, v.duration || 0);
    }, 5000);
    const onHide = () => {
      const v = videoRef.current;
      if (v && v.currentTime) setResume(resumeKey, v.currentTime, v.duration || 0);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
      onHide();
    };
  }, [phase, resumeKey]);

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
    setCaptions([]);
    setSelectedUrl("");
    setSelectedRes(0);
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
      setCaptions(res.captions || []);
      setPhase("select");
    })();
    return () => {
      active = false;
    };
  }, [title, year, type, tmdbId, season, episode]);

  const pickQuality = useCallback((d: MovieboxDownload) => {
    const v = videoRef.current;
    if (v && !v.paused) resumeAtRef.current = v.currentTime || 0;
    setSelectedUrl(movieboxProxyUrl(d.url));
    setSelectedRes(d.resolution);
    try {
      localStorage.setItem(QUALITY_PREF_KEY, String(d.resolution));
    } catch {
      /* ignore */
    }
    setPhase("playing");
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (v && resumeAtRef.current > 0) {
      try { v.currentTime = resumeAtRef.current; } catch { /* ignore */ }
      resumeAtRef.current = 0;
      v.play().catch(() => {});
    }
  }, []);

  // Restore preferred subtitle language once captions are known.
  useEffect(() => {
    if (captions.length === 0) return;
    let pref = "off";
    try { pref = localStorage.getItem(SUBTITLE_PREF_KEY) || "off"; } catch { /* ignore */ }
    if (pref !== "off" && captions.some((c) => c.lang === pref)) setSubtitleLang(pref);
  }, [captions]);

  // Fetch + convert the chosen subtitle to a VTT blob URL the <video> can render.
  useEffect(() => {
    if (subtitleLang === "off") {
      setSubtitleVttUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ""; });
      return;
    }
    const cap = captions.find((c) => c.lang === subtitleLang);
    if (!cap) return;
    let cancelled = false;
    let createdUrl = "";
    (async () => {
      try {
        const res = await fetch(movieboxProxyUrl(cap.url));
        const text = await res.text();
        const vtt = text.trim().startsWith("WEBVTT") ? text : srtToVtt(text);
        const blob = new Blob([vtt], { type: "text/vtt" });
        createdUrl = URL.createObjectURL(blob);
        if (!cancelled) setSubtitleVttUrl(createdUrl);
      } catch { /* ignore */ }
    })();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [subtitleLang, captions]);

  const pickSubtitle = useCallback((lang: string) => {
    setSubtitleLang(lang);
    try { localStorage.setItem(SUBTITLE_PREF_KEY, lang); } catch { /* ignore */ }
  }, []);

  // Force the newly added <track> to actually show (browsers default to "disabled").
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tracks = v.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = subtitleVttUrl && subtitleLang !== "off" ? "showing" : "disabled";
    }
  }, [subtitleVttUrl, subtitleLang, selectedUrl]);

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
            {...(subtitleVttUrl ? { crossOrigin: "anonymous" as const } : {})}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setEnded(true)}
          >
            {subtitleVttUrl && (
              <track
                key={subtitleVttUrl}
                kind="subtitles"
                src={subtitleVttUrl}
                srcLang={subtitleLang}
                label={subtitleLang}
                default
              />
            )}
          </video>
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
          <UpNextCard item={nextItem} onNext={onNext} autoplay={getSetting("autoplay")} />
        )}
      </div>

      {/* Toolbar: Download + Fullscreen */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-background border-t border-border/60 flex-wrap">
        <div className="flex items-center gap-1.5 ml-auto">
          {phase === "playing" && downloads.length > 1 && (
            <QualityMenu downloads={downloads} current={selectedRes} onPick={pickQuality} />
          )}
          {phase === "playing" && captions.length > 0 && (
            <SubtitleMenu captions={captions} current={subtitleLang} onPick={pickSubtitle} />
          )}
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
      <FollowChannelBanner />
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
  autoplay,
}: {
  item: { title: string; poster?: string | null; subtitle?: string };
  onNext: () => void;
  autoplay: boolean;
}) => {
  const [n, setN] = useState(autoplay ? 5 : -1);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (n < 0) return; // autoplay disabled — wait for manual click
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
        <p className="text-[9px] font-bold uppercase tracking-wider text-[#E50914]">
          {autoplay && n >= 0 ? `Up Next in ${n}s` : "Up Next"}
        </p>
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

// Naive SRT -> WebVTT: change comma timestamps to periods and prepend header.
function srtToVtt(srt: string): string {
  const body = srt.replace(/\r+/g, "").replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return `WEBVTT\n\n${body}`;
}

const ToolbarMenu = ({
  icon,
  label,
  options,
  currentKey,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  options: { key: string; label: string }[];
  currentKey: string;
  onPick: (key: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={label}
        aria-label={label}
        className="inline-flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-3 rounded-md text-[11px] sm:text-[12px] font-semibold text-foreground hover:bg-foreground/10 border border-border/60"
      >
        {icon}
        <span className="hidden xs:inline sm:inline">{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1.5 z-40 min-w-[180px] rounded-md border border-border/60 bg-background shadow-xl overflow-hidden">
          <p className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/50 bg-white/5">{label}</p>
          <div className="max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const active = opt.key === currentKey;
              return (
                <button
                  key={opt.key}
                  onClick={() => { onPick(opt.key); setOpen(false); }}
                  className={`w-full text-left px-2.5 py-1.5 text-[11px] font-semibold flex items-center justify-between gap-2 hover:bg-white/10 ${active ? "text-[#E50914]" : "text-white"}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && <span className="text-[9px]">●</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const QualityMenu = ({
  downloads,
  current,
  onPick,
}: {
  downloads: MovieboxDownload[];
  current: number;
  onPick: (d: MovieboxDownload) => void;
}) => {
  const options = useMemo(
    () => downloads.map((d) => ({ key: String(d.resolution), label: resolutionLabel(d.resolution) })),
    [downloads],
  );
  return (
    <ToolbarMenu
      icon={<Settings className="w-4 h-4" />}
      label="Quality"
      options={options}
      currentKey={String(current)}
      onPick={(k) => {
        const d = downloads.find((x) => String(x.resolution) === k);
        if (d) onPick(d);
      }}
    />
  );
};

const SubtitleMenu = ({
  captions,
  current,
  onPick,
}: {
  captions: MovieboxCaption[];
  current: string;
  onPick: (lang: string) => void;
}) => {
  const options = useMemo(
    () => [
      { key: "off", label: "Off" },
      ...captions.map((c) => ({ key: c.lang, label: languageName(c.lang) })),
    ],
    [captions],
  );
  return (
    <ToolbarMenu
      icon={<Subtitles className="w-4 h-4" />}
      label="Subtitles"
      options={options}
      currentKey={current}
      onPick={onPick}
    />
  );
};

// Map MovieBox short language codes / labels to full human-readable names.
// Falls back to Intl.DisplayNames when possible, then the raw value.
function languageName(code: string): string {
  if (!code) return "Unknown";
  const raw = code.trim();
  const lower = raw.toLowerCase();
  const map: Record<string, string> = {
    en: "English", eng: "English", "en-us": "English (US)", "en-gb": "English (UK)",
    es: "Spanish", spa: "Spanish", "es-la": "Spanish (Latin America)", "es-es": "Spanish (Spain)",
    fr: "French", fre: "French", fra: "French",
    de: "German", ger: "German", deu: "German",
    it: "Italian", ita: "Italian",
    pt: "Portuguese", por: "Portuguese", "pt-br": "Portuguese (Brazil)",
    ru: "Russian", rus: "Russian",
    ja: "Japanese", jpn: "Japanese",
    ko: "Korean", kor: "Korean",
    zh: "Chinese", chi: "Chinese", zho: "Chinese", "zh-cn": "Chinese (Simplified)", "zh-tw": "Chinese (Traditional)",
    ar: "Arabic", ara: "Arabic",
    hi: "Hindi", hin: "Hindi",
    id: "Indonesian", ind: "Indonesian",
    th: "Thai", tha: "Thai",
    vi: "Vietnamese", vie: "Vietnamese",
    tr: "Turkish", tur: "Turkish",
    nl: "Dutch", dut: "Dutch", nld: "Dutch",
    pl: "Polish", pol: "Polish",
    sv: "Swedish", swe: "Swedish",
    no: "Norwegian", nor: "Norwegian",
    da: "Danish", dan: "Danish",
    fi: "Finnish", fin: "Finnish",
    he: "Hebrew", heb: "Hebrew",
    fa: "Persian", per: "Persian", fas: "Persian",
    sw: "Swahili", swa: "Swahili",
    ur: "Urdu", urd: "Urdu",
    bn: "Bengali", ben: "Bengali",
    ta: "Tamil", tam: "Tamil",
    te: "Telugu", tel: "Telugu",
    ml: "Malayalam", mal: "Malayalam",
    ms: "Malay", may: "Malay", msa: "Malay",
    tl: "Filipino", fil: "Filipino",
    ro: "Romanian", rum: "Romanian", ron: "Romanian",
    cs: "Czech", cze: "Czech", ces: "Czech",
    el: "Greek", gre: "Greek", ell: "Greek",
    hu: "Hungarian", hun: "Hungarian",
    uk: "Ukrainian", ukr: "Ukrainian",
  };
  if (map[lower]) return map[lower];
  try {
    const dn = new (Intl as any).DisplayNames(["en"], { type: "language" });
    const name = dn.of(lower);
    if (name && name.toLowerCase() !== lower) return name;
  } catch { /* ignore */ }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
