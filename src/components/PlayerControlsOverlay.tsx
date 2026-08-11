import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";

/**
 * Premium player control overlay.
 *
 * - Appears on tap / mouse move / keyboard (remote) input
 * - Auto-fades after a few seconds of inactivity
 * - Stays visible while the user is hovering or interacting with the controls
 * - Dims the video behind the controls for contrast
 *
 * Designed to sit inside a `position: relative` player shell together with a
 * `<video>` element rendered with `controls={false}`.
 */
interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  /** Re-arms the overlay when the source changes. */
  sourceKey?: string;
  title?: string;
  subtitle?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToggleFullscreen?: () => void;
  /** Extra controls rendered in the top-right (quality, subtitles, …). */
  topRight?: ReactNode;
  /** Extra controls rendered in the bottom bar, next to the volume control. */
  bottomRight?: ReactNode;
  /** Transient status message (e.g. "Downloading this part…"). */
  note?: string;
  /** Upper bound for seeking, in seconds (partially downloaded media). */
  maxSeekTime?: number;
  hideDelay?: number;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

const PlayerControlsOverlay = ({
  videoRef,
  sourceKey,
  title,
  subtitle,
  onPrev,
  onNext,
  onToggleFullscreen,
  topRight,
  bottomRight,
  hideDelay = 3500,
}: Props) => {
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [buffering, setBuffering] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [pill, setPill] = useState<{ dir: "fwd" | "back" } | null>(null);
  const holdRef = useRef(false);
  const timer = useRef<number | null>(null);

  /** Show the controls and (re)start the inactivity countdown. */
  const wake = useCallback(() => {
    setVisible(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      // Never hide while the user is actively interacting or while paused.
      if (holdRef.current) return;
      const v = videoRef.current;
      if (v && v.paused) return;
      setVisible(false);
    }, hideDelay);
  }, [hideDelay, videoRef]);

  useEffect(() => {
    wake();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [wake, sourceKey]);

  // Sync overlay state with the underlying media element.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => {
      setPaused(v.paused);
      setMuted(v.muted);
      setVolume(v.volume);
    };
    const onTime = () => setCurrent(v.currentTime || 0);
    const onMeta = () => setDuration(v.duration || 0);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => {
      setBuffering(false);
      sync();
      wake();
    };
    sync();
    onMeta();
    v.addEventListener("play", sync);
    v.addEventListener("pause", () => {
      sync();
      setVisible(true);
    });
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("volumechange", sync);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", () => setBuffering(false));
    return () => {
      v.removeEventListener("play", sync);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("volumechange", sync);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
    };
  }, [videoRef, sourceKey, wake]);

  useEffect(() => {
    const onFs = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    wake();
  }, [videoRef, wake]);

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      const max = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : Infinity;
      v.currentTime = Math.max(0, Math.min(max, (v.currentTime || 0) + delta));
      setPill({ dir: delta > 0 ? "fwd" : "back" });
      window.setTimeout(() => setPill(null), 600);
      wake();
    },
    [videoRef, wake],
  );

  // Keyboard / TV-remote support. Any key also wakes the overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      wake();
      switch (e.key) {
        case " ":
        case "k":
        case "MediaPlayPause":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-10);
          break;
        case "ArrowUp": {
          const v = videoRef.current;
          if (v) v.volume = Math.min(1, v.volume + 0.1);
          break;
        }
        case "ArrowDown": {
          const v = videoRef.current;
          if (v) v.volume = Math.max(0, v.volume - 0.1);
          break;
        }
        case "m": {
          const v = videoRef.current;
          if (v) v.muted = !v.muted;
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seekBy, togglePlay, videoRef, wake]);

  const hold = (on: boolean) => {
    holdRef.current = on;
    if (on) setVisible(true);
    else wake();
  };

  const pct = duration > 0 ? ((seekPreview ?? current) / duration) * 100 : 0;

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSeekPreview(val);
  };
  const commitScrub = () => {
    const v = videoRef.current;
    if (v && seekPreview !== null) v.currentTime = seekPreview;
    setSeekPreview(null);
    wake();
  };

  const circle =
    "grid place-items-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100";

  return (
    <div
      className="absolute inset-0 z-30 select-none"
      onPointerMove={wake}
      onPointerDown={wake}
      onClick={(e) => {
        // A tap on the empty area wakes hidden controls, or toggles playback
        // when they are already showing.
        if (!visible) {
          wake();
          return;
        }
        if (e.target === e.currentTarget) togglePlay();
      }}
      onMouseEnter={wake}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) togglePlay();
        }}
      >
      {/* Dim layer for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/80 pointer-events-none" />

      {/* Top row — title + extra menus */}
      <div className="absolute top-0 inset-x-0 flex items-start gap-3 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          {title && (
            <p className="text-white text-[13px] sm:text-[15px] font-bold tracking-tight truncate drop-shadow">
              {title}
            </p>
          )}
          {subtitle && <p className="text-white/65 text-[10px] sm:text-[11px] truncate">{subtitle}</p>}
        </div>
        {topRight && (
          <div
            className="flex items-center gap-1.5"
            onMouseEnter={() => hold(true)}
            onMouseLeave={() => hold(false)}
            onPointerDown={() => hold(true)}
            onPointerUp={() => hold(false)}
          >
            {topRight}
          </div>
        )}
      </div>

      {/* Center playback cluster */}
      <div
        className="absolute inset-0 flex items-center justify-center gap-2 sm:gap-5 md:gap-7"
        onMouseEnter={() => hold(true)}
        onMouseLeave={() => hold(false)}
      >
        <button
          type="button"
          aria-label="Previous episode"
          title="Previous"
          disabled={!onPrev}
          onClick={onPrev}
          className={`${circle} h-11 w-11 sm:h-12 sm:w-12`}
        >
          <SkipBack className="h-5 w-5 fill-current" />
        </button>

        <button
          type="button"
          aria-label="Skip back 10 seconds"
          title="Back 10s"
          onClick={() => seekBy(-10)}
          className={`${circle} relative h-12 w-12 sm:h-14 sm:w-14`}
        >
          <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="absolute text-[8px] sm:text-[9px] font-black tracking-tight">10s</span>
        </button>

        <button
          type="button"
          aria-label={paused ? "Play" : "Pause"}
          title={paused ? "Play" : "Pause"}
          onClick={togglePlay}
          className="grid place-items-center h-[68px] w-[68px] sm:h-20 sm:w-20 rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(229,9,20,0.92)",
            boxShadow: "0 0 34px rgba(229,9,20,0.55), inset 0 0 0 1px rgba(255,255,255,0.18)",
          }}
        >
          {buffering && !paused ? (
            <span className="block h-7 w-7 rounded-full border-2 border-white/35 border-t-white animate-spin" />
          ) : paused ? (
            <Play className="h-8 w-8 sm:h-9 sm:w-9 fill-white translate-x-0.5" />
          ) : (
            <Pause className="h-8 w-8 sm:h-9 sm:w-9 fill-white" />
          )}
        </button>

        <button
          type="button"
          aria-label="Skip forward 10 seconds"
          title="Forward 10s"
          onClick={() => seekBy(10)}
          className={`${circle} relative h-12 w-12 sm:h-14 sm:w-14`}
        >
          <RotateCw className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="absolute text-[8px] sm:text-[9px] font-black tracking-tight">10s</span>
        </button>

        <button
          type="button"
          aria-label="Next episode"
          title="Next"
          disabled={!onNext}
          onClick={onNext}
          className={`${circle} h-11 w-11 sm:h-12 sm:w-12`}
        >
          <SkipForward className="h-5 w-5 fill-current" />
        </button>
      </div>

      {pill && (
        <div
          className={`absolute top-[18%] ${
            pill.dir === "fwd" ? "right-8" : "left-8"
          } rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold text-white pointer-events-none`}
        >
          {pill.dir === "fwd" ? "»" : "«"} 10s
        </div>
      )}

      {/* Bottom bar — scrubber, time, volume, fullscreen */}
      <div
        className="absolute bottom-0 inset-x-0 px-3 pb-2.5 sm:px-4 sm:pb-3.5"
        onMouseEnter={() => hold(true)}
        onMouseLeave={() => hold(false)}
        onPointerDown={() => hold(true)}
        onPointerUp={() => hold(false)}
      >
        <div className="relative h-6 flex items-center">
          <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/25" />
          <div
            className="absolute h-[3px] rounded-full bg-[#E50914]"
            style={{ width: `${pct}%` }}
          />
          <span
            className="absolute h-3 w-3 rounded-full bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.8)]"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={seekPreview ?? current}
            onChange={onScrub}
            onMouseUp={commitScrub}
            onTouchEnd={commitScrub}
            onKeyUp={commitScrub}
            aria-label="Seek"
            className="absolute inset-x-0 h-6 w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[10px] sm:text-[11px] font-semibold tabular-nums text-white/85">
            {fmt(seekPreview ?? current)} / {fmt(duration)}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => {
                const v = videoRef.current;
                if (v) v.muted = !v.muted;
                wake();
              }}
              className={`${circle} h-9 w-9`}
            >
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(e) => {
                const v = videoRef.current;
                if (v) {
                  v.volume = Number(e.target.value);
                  v.muted = Number(e.target.value) === 0;
                }
                wake();
              }}
              className="hidden sm:block w-20 accent-[#E50914]"
            />
            {/* Subtitles / quality / download / share / watchlist live here,
                right next to the volume control. */}
            {bottomRight}
            {onToggleFullscreen && (
              <button
                type="button"
                aria-label="Fullscreen"
                onClick={() => {
                  onToggleFullscreen();
                  wake();
                }}
                className={`${circle} h-9 w-9`}
              >
                {isFs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PlayerControlsOverlay;
