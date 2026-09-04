import { useEffect, useMemo, useRef, useState } from "react";

const AD_KEY = "1a3361e4e76e4c3f2944b9efa3332530";
const CONTAINER_ID = `container-${AD_KEY}`;
const INVOKE_SRC = `https://disturbknockedcaterpillar.com/${AD_KEY}/invoke.js`;

/**
 * Adsterra native banner.
 *
 * The invoke script is mounted inside an isolated `srcDoc` iframe instead of the
 * app document. That is deliberate and solves the usual SPA ad problems:
 *  - no duplicate global script injection (each iframe has its own window)
 *  - the container id the script looks for always exists before the script runs
 *  - React re-renders and route changes cannot orphan the placement; when a
 *    page unmounts, its iframe (and every listener/timer inside it) is disposed,
 *    so there are no leaks or stale event listeners
 *  - the script is fully off the main document's critical path, so it can never
 *    block app rendering
 *
 * The iframe is only created once the slot scrolls near the viewport, keeping
 * startup light in both browsers and installed PWAs.
 */
const buildSrcDoc = (heightPx: number) => `<!doctype html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  html,body{margin:0;padding:0;background:transparent;overflow:hidden;
    font-family:-apple-system,system-ui,sans-serif;color:#9ca3af;}
  #${CONTAINER_ID}{width:100%;min-height:${heightPx}px;display:block;}
  a{color:inherit;}
</style>
</head><body>
<div id="${CONTAINER_ID}"></div>
<script async data-cfasync="false" src="${INVOKE_SRC}"><\/script>
</body></html>`;

const NativeAd = ({
  className = "",
  compact = false,
  inline = false,
  height,
  desktopHeight,
}: {
  className?: string;
  compact?: boolean;
  inline?: boolean;
  height?: number;
  desktopHeight?: number;
}) => {
  const h = height ?? (inline ? 110 : compact ? 130 : 180);
  const dh = desktopHeight ?? (inline ? 260 : compact ? 280 : 320);
  const srcDoc = useMemo(() => buildSrcDoc(Math.max(h, dh)), [h, dh]);

  const slotRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  // Mount the ad frame only when the slot is close to the viewport. Observer is
  // disconnected immediately after firing so nothing is left listening.
  useEffect(() => {
    const el = slotRef.current;
    if (!el || armed) return;
    if (typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  const frame = (
    <div
      ref={slotRef}
      className="w-full h-[var(--ad-h)] md:h-[var(--ad-dh)]"
      style={{ ["--ad-h" as string]: `${h}px`, ["--ad-dh" as string]: `${dh}px` }}
    >
      {armed && (
        <iframe
          title="Sponsored"
          srcDoc={srcDoc}
          scrolling="no"
          loading="lazy"
          allow="autoplay; clipboard-write"
          className="w-full h-full block rounded-md overflow-hidden border-0"
        />
      )}
    </div>
  );

  if (inline) {
    return (
      <div role="complementary" aria-label="Sponsored" className={`w-full ${className}`}>
        {frame}
      </div>
    );
  }

  return (
    <div
      role="complementary"
      aria-label="Sponsored"
      className={`w-full px-[5%] ${compact ? "my-2" : "my-5"} ${className}`}
    >
      <span className="block text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">
        Sponsored
      </span>
      {frame}
    </div>
  );
};

export default NativeAd;
