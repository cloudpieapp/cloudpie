import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Layers,
  Subtitles,
  SlidersHorizontal,
  Gauge,
  Maximize,
  Minimize,
  Loader2,
} from "lucide-react";
import PlayerSheet, { type SheetOption } from "./PlayerSheet";
import { formatClock } from "./PremiumLoader";

type SheetKind = "sources" | "quality" | "subtitles" | "speed" | null;

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  visible: boolean;
  onActivity: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  sources: SheetOption[];
  activeSource: string;
  onSourceChange: (key: string) => void;
  qualities: SheetOption[];
  activeQuality: string;
  qualityLabel: string;
  onQualityChange: (key: string) => void;
  subtitles: SheetOption[];
  activeSubtitle: string;
  onSubtitleChange: (key: string) => void;
  waiting?: boolean;
  title?: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Full custom control surface: large center play / ±10s controls plus a
 * consistent bottom bar (seek + times + Sources / Subtitles / Quality / Speed /
 * Fullscreen). Buttons never disappear based on availability — they always keep
 * the same position so users always know where they are.
 */
const PlayerControls = ({
  videoRef,
  visible,
  onActivity,
  isFullscreen,
  onToggleFullscreen,
  sources,
  activeSource,
  onSourceChange,
  qualities,
  activeQuality,
  qualityLabel,
  onQualityChange,
  subtitles,
  activeSubtitle,
  onSubtitleChange,
  waiting,
  title,
}: Props) => {
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  // Mirror video state into React.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => {
      setPaused(v.paused);
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
      if (!dragging) setCurrent(v.currentTime || 0);
      setSpeed(v.playbackRate || 1);
      try {
        const b = v.buffered;
        let end = 0;
        for (let i = 0; i < b.length; i++) {
          if (b.start(i) <= v.currentTime + 0.5) end = Math.max(end, b.end(i));
        }
        setBufferedEnd(end || (b.length ? b.end(b.length - 1) : 0));
      } catch {
        /* ignore */
      }
    };
    sync();
    const evts = ["play", "pause", "timeupdate", "progress", "durationchange", "loadedmetadata", "ratechange", "seeked", "waiting", "playing"];
    evts.forEach((e) => v.addEventListener(e, sync));
    const iv = window.setInterval(sync, 500);
    return () => {
      evts.forEach((e) => v.removeEventListener(e, sync));
      window.clearInterval(iv);
    };
  }, [videoRef, dragging]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    onActivity();
  }, [videoRef, onActivity]);

  const skip = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      const max = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : v.currentTime + 30;
      try {
        v.currentTime = Math.max(0, Math.min(max, v.currentTime + delta));
      } catch {
        /* ignore */
      }
      onActivity();
    },
    [videoRef, onActivity],
  );

  // Keyboard / TV-remote navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === " " || e.key === "Enter" || e.key === "MediaPlayPause") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        skip(10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        skip(-10);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const v = videoRef.current;
        if (v) v.volume = Math.max(0, Math.min(1, v.volume + (e.key === "ArrowUp" ? 0.1 : -0.1)));
        onActivity();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, skip, videoRef, onActivity]);

  const pct = (t: number) => (duration > 0 ? Math.min(100, Math.max(0, (t / duration) * 100)) : 0);
  const shownTime = dragging ? dragValue : current;

  const seekFromEvent = (clientX: number) => {
    const el = barRef.current;
    const v = videoRef.current;
    if (!el || !v || duration <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return frac * duration;
  };

  const commitSeek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = t;
    } catch {
      /* ignore */
    }
    if (v.paused) v.play().catch(() => {});
  };

  const dragHint = dragging && bufferedEnd > 0 && dragValue > bufferedEnd;

  const closeSheet = () => setSheet(null);

  return (
    <>
      <div
        className={`absolute inset-0 z-[40] transition-opacity duration-300 ${
          visible || sheet ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Gradient scrims for legibility */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />

        {title && (
          <p className="absolute top-2.5 left-3 right-3 text-[12px] sm:text-[13px] font-semibold text-white/90 truncate pointer-events-none">
            {title}
          </p>
        )}

        {/* ---- Center controls ---- */}
        <div className="absolute inset-0 flex items-center justify-center gap-6 sm:gap-10 pointer-events-none">
          <button
            onClick={() => skip(-10)}
            aria-label="Back 10 seconds"
            className="pointer-events-auto grid place-items-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-black/45 text-white backdrop-blur-sm border border-white/10 transition-transform active:scale-90 hover:bg-black/65"
          >
            <span className="relative grid place-items-center">
              <RotateCcw className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.6} />
              <span className="absolute text-[8.5px] font-extrabold tracking-tight">10s</span>
            </span>
          </button>

          <button
            onClick={togglePlay}
            aria-label={paused ? "Play" : "Pause"}
            className="pointer-events-auto grid place-items-center h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#E50914] text-white shadow-[0_0_36px_rgba(229,9,20,0.55)] transition-transform active:scale-90 hover:scale-105"
          >
            {waiting ? (
              <Loader2 className="h-9 w-9 sm:h-10 sm:w-10 animate-spin" />
            ) : paused ? (
              <Play className="h-9 w-9 sm:h-11 sm:w-11 fill-white ml-1" />
            ) : (
              <Pause className="h-9 w-9 sm:h-11 sm:w-11 fill-white" />
            )}
          </button>

          <button
            onClick={() => skip(10)}
            aria-label="Forward 10 seconds"
            className="pointer-events-auto grid place-items-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-black/45 text-white backdrop-blur-sm border border-white/10 transition-transform active:scale-90 hover:bg-black/65"
          >
            <span className="relative grid place-items-center">
              <RotateCw className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.6} />
              <span className="absolute text-[8.5px] font-extrabold tracking-tight">10s</span>
            </span>
          </button>
        </div>

        {/* ---- Bottom bar ---- */}
        <div className="absolute inset-x-0 bottom-0 px-2.5 sm:px-4 pb-2 sm:pb-3">
          {/* Seek bar: played / buffered / remaining */}
          <div
            ref={barRef}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(shownTime)}
            tabIndex={0}
            className="relative h-8 flex items-center cursor-pointer touch-none select-none"
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              const t = seekFromEvent(e.clientX);
              setDragging(true);
              setDragValue(t);
              onActivity();
            }}
            onPointerMove={(e) => {
              if (!dragging) return;
              setDragValue(seekFromEvent(e.clientX));
            }}
            onPointerUp={(e) => {
              if (!dragging) return;
              const t = seekFromEvent(e.clientX);
              setDragging(false);
              setCurrent(t);
              commitSeek(t);
              onActivity();
            }}
            onPointerCancel={() => setDragging(false)}
          >
            <div className="relative w-full h-1.5 rounded-full bg-white/20 overflow-visible">
              {/* buffered */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-[width] duration-200"
                style={{ width: `${pct(bufferedEnd)}%` }}
              />
              {/* played */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#E50914]"
                style={{ width: `${pct(shownTime)}%` }}
              />
              {/* handle */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow transition-all ${
                  dragging ? "h-4 w-4" : "h-3 w-3"
                }`}
                style={{ left: `${pct(shownTime)}%` }}
              />
            </div>
            {dragging && (
              <div
                className="absolute -top-1 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/85 border border-white/15 text-[10.5px] font-bold text-white pointer-events-none whitespace-nowrap"
                style={{ left: `${pct(dragValue)}%` }}
              >
                {formatClock(dragValue)}
                {dragHint ? " · loading…" : ""}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-x-auto scrollbar-hide">
            <span className="text-[11px] font-bold text-white tabular-nums whitespace-nowrap">
              {formatClock(shownTime)}
            </span>
            <span className="text-[11px] font-medium text-white/45 tabular-nums whitespace-nowrap">
              / {formatClock(duration)}
            </span>

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              <BarButton
                icon={<Layers className="h-4 w-4" />}
                label="Sources"
                onClick={() => setSheet("sources")}
              />
              <BarButton
                icon={<Subtitles className="h-4 w-4" />}
                label="Subtitles"
                onClick={() => setSheet("subtitles")}
              />
              <BarButton
                icon={<SlidersHorizontal className="h-4 w-4" />}
                label="Quality"
                hint={qualityLabel}
                onClick={() => setSheet("quality")}
              />
              <BarButton
                icon={<Gauge className="h-4 w-4" />}
                label="Speed"
                hint={`${speed}x`}
                onClick={() => setSheet("speed")}
              />
              <BarButton
                icon={isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                label={isFullscreen ? "Exit" : "Fullscreen"}
                onClick={onToggleFullscreen}
                iconOnly
              />
            </div>
          </div>
        </div>
      </div>

      {sheet === "sources" && (
        <PlayerSheet
          title="Sources"
          options={sources}
          activeKey={activeSource}
          onPick={(k) => {
            onSourceChange(k);
            closeSheet();
          }}
          onClose={closeSheet}
        />
      )}
      {sheet === "quality" && (
        <PlayerSheet
          title="Quality"
          options={qualities}
          activeKey={activeQuality}
          emptyLabel="Only one quality is available for this source"
          onPick={(k) => {
            onQualityChange(k);
            closeSheet();
          }}
          onClose={closeSheet}
        />
      )}
      {sheet === "subtitles" && (
        <PlayerSheet
          title="Subtitles"
          options={subtitles}
          activeKey={activeSubtitle}
          emptyLabel="No subtitles available"
          onPick={(k) => {
            onSubtitleChange(k);
            closeSheet();
          }}
          onClose={closeSheet}
        />
      )}
      {sheet === "speed" && (
        <PlayerSheet
          title="Playback speed"
          options={SPEEDS.map((s) => ({ key: String(s), label: s === 1 ? "Normal (1x)" : `${s}x` }))}
          activeKey={String(speed)}
          onPick={(k) => {
            const v = videoRef.current;
            if (v) v.playbackRate = Number(k) || 1;
            closeSheet();
          }}
          onClose={closeSheet}
        />
      )}
    </>
  );
};

const BarButton = ({
  icon,
  label,
  hint,
  onClick,
  iconOnly,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  iconOnly?: boolean;
}) => (
  <button
    onClick={onClick}
    title={hint ? `${label} · ${hint}` : label}
    aria-label={label}
    className="inline-flex items-center gap-1.5 h-9 px-2 sm:px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition active:scale-95 whitespace-nowrap"
  >
    {icon}
    {!iconOnly && <span className="hidden sm:inline text-[11.5px] font-semibold">{label}</span>}
    {hint && !iconOnly && (
      <span className="text-[10px] font-bold text-white/60 hidden md:inline">{hint}</span>
    )}
  </button>
);

export default PlayerControls;
