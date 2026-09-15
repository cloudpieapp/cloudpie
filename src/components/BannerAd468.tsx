import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Adsterra 468x60 banner. Rendered inside an isolated srcDoc iframe so the
 * global `atOptions` of multiple slots never collide, and scaled down on narrow
 * screens so it always fits a phone perfectly without horizontal overflow.
 */
const AD_KEY = "5b6beb58c6b3a15cbeec08371006507f";
const AD_W = 468;
const AD_H = 60;

const SRC_DOC = `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}</style>
</head><body>
<script type="text/javascript">
  atOptions = {
    'key' : '${AD_KEY}',
    'format' : 'iframe',
    'height' : ${AD_H},
    'width' : ${AD_W},
    'params' : {}
  };
<\/script>
<script async data-cfasync="false" src="https://disturbknockedcaterpillar.com/${AD_KEY}/invoke.js"><\/script>
</body></html>`;

const BannerAd468 = ({ className = "", label = true }: { className?: string; label?: boolean }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [scale, setScale] = useState(1);

  // Mount only when near the viewport.
  useEffect(() => {
    const el = wrapRef.current;
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
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  // Fit the fixed 468px creative into whatever width we actually have.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, w / AD_W));
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const srcDoc = useMemo(() => SRC_DOC, []);

  return (
    <div
      ref={wrapRef}
      role="complementary"
      aria-label="Advertisement"
      className={`w-full overflow-hidden ${className}`}
    >
      {label && (
        <span className="block text-center text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">
          Sponsored
        </span>
      )}
      <div className="mx-auto" style={{ width: AD_W * scale, height: AD_H * scale }}>
        {armed && (
          <iframe
            title="Sponsored"
            srcDoc={srcDoc}
            scrolling="no"
            loading="lazy"
            width={AD_W}
            height={AD_H}
            className="block border-0 rounded-md"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BannerAd468;
