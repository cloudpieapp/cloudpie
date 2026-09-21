import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Transparent overlay that adds double-tap seek, left-edge brightness swipe
 * and right-edge volume swipe to a <video> element. Positioned inside the
 * player shell above the video but shorter than the shell so the native
 * controls at the bottom stay clickable.
 */
interface Props {
  videoRef: RefObject<HTMLVideoElement>;
}

type DragState = { startY: number; side: "L" | "R"; startVal: number } | null;

const PlayerGestureLayer = ({ videoRef }: Props) => {
  const [pill, setPill] = useState<{ dir: "fwd" | "back"; s: number } | null>(null);
  const [brightness, setBrightness] = useState(1);
  const [volumePct, setVolumePct] = useState<number | null>(null);
  const [brightnessShown, setBrightnessShown] = useState(false);
  const lastTap = useRef({ t: 0, x: 0 });
  const drag = useRef<DragState>(null);

  // Apply brightness as a CSS filter on the video element.
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.style.filter = `brightness(${brightness})`;
  }, [brightness, videoRef]);

  const onClick = (e: React.PointerEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (now - lastTap.current.t < 300 && Math.abs(x - lastTap.current.x) < 80) {
      const v = videoRef.current;
      if (v) {
        const isRight = x > rect.width / 2;
        const delta = isRight ? 10 : -10;
        try {
          v.currentTime = Math.max(0, Math.min((v.duration || 0) || v.currentTime + 10, v.currentTime + delta));
        } catch { /* ignore */ }
        setPill({ dir: isRight ? "fwd" : "back", s: 10 });
        window.setTimeout(() => setPill(null), 700);
      }
      lastTap.current = { t: 0, x: 0 };
    } else {
      lastTap.current = { t: now, x };
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    let side: "L" | "R" | null = null;
    if (frac < 0.22) side = "L";
    else if (frac > 0.78) side = "R";
    if (!side) return;
    const v = videoRef.current;
    drag.current = {
      startY: e.clientY,
      side,
      startVal: side === "L" ? brightness : (v?.volume ?? 1),
    };
    if (side === "L") setBrightnessShown(true);
    try { target.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const delta = (drag.current.startY - e.clientY) / rect.height;
    const max = drag.current.side === "L" ? 1.5 : 1;
    const next = Math.max(0, Math.min(max, drag.current.startVal + delta * 1.4));
    if (drag.current.side === "L") {
      setBrightness(next);
    } else {
      const v = videoRef.current;
      if (v) v.volume = Math.min(1, next);
      setVolumePct(Math.min(1, next));
    }
  };

  const onPointerUp = () => {
    const side = drag.current?.side;
    drag.current = null;
    window.setTimeout(() => {
      setVolumePct(null);
      if (side === "L") setBrightnessShown(false);
    }, 900);
  };

  return (
    <div
      className="absolute inset-x-0 top-0 z-[15]"
      style={{ bottom: "18%", touchAction: "manipulation" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
    >
      {pill && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            pill.dir === "fwd" ? "right-6" : "left-6"
          } bg-black/70 text-white text-xs font-bold px-3 py-2 rounded-full pointer-events-none`}
        >
          {pill.dir === "fwd" ? "»" : "«"} {pill.s}s
        </div>
      )}
      {volumePct !== null && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex flex-col items-center gap-1 bg-black/65 rounded-lg px-2 py-2 pointer-events-none">
          <div className="text-[9px] text-white/80 font-bold">VOL</div>
          <div className="w-1.5 h-16 rounded-full bg-white/20 relative overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-[#7517FF]"
              style={{ height: `${volumePct * 100}%` }}
            />
          </div>
        </div>
      )}
      {brightnessShown && (
        <div className="absolute top-1/2 left-3 -translate-y-1/2 flex flex-col items-center gap-1 bg-black/65 rounded-lg px-2 py-2 pointer-events-none">
          <div className="text-[9px] text-white/80 font-bold">BR</div>
          <div className="w-1.5 h-16 rounded-full bg-white/20 relative overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-amber-400"
              style={{ height: `${(brightness / 1.5) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerGestureLayer;