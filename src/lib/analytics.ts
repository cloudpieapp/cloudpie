/**
 * Single source of truth for BingBloom analytics.
 *
 * The app is a SPA, so the only automatic page view a provider records is the
 * first document load. Everything after that has to be reported manually. This
 * module normalizes that: one `trackPageView` call per route change, dedup on
 * identical path+title, session preserved in sessionStorage, and it works for
 * installed PWAs (display-mode standalone) as well as the browser.
 *
 * It forwards to whatever provider is present at runtime (Lovable native
 * analytics beacon, gtag, PostHog) without ever initializing more than once.
 */

type Props = Record<string, unknown>;

const SESSION_KEY = "bb:analytics:session";
const SESSION_TTL = 1000 * 60 * 30; // 30 min rolling window

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    posthog?: { capture: (event: string, props?: Props) => void };
    __bbAnalytics?: { session: string; lastKey: string };
  }
}

const state = (): { session: string; lastKey: string } => {
  if (!window.__bbAnalytics) window.__bbAnalytics = { session: "", lastKey: "" };
  return window.__bbAnalytics;
};

/** Rolling session id, kept across navigations and reloads within the TTL. */
export const getSessionId = (): string => {
  const s = state();
  if (s.session) return s.session;
  let id = "";
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; ts: number };
      if (parsed.id && Date.now() - parsed.ts < SESSION_TTL) id = parsed.id;
    }
  } catch {
    /* storage unavailable */
  }
  if (!id) id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  s.session = id;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
  } catch {
    /* ignore */
  }
  return id;
};

const touchSession = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: getSessionId(), ts: Date.now() }));
  } catch {
    /* ignore */
  }
};

export const isStandalone = (): boolean => {
  try {
    return (
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
};

const surface = () => (isStandalone() ? "pwa" : "browser");

/** Low-level event dispatch. Never throws, never blocks rendering. */
export const trackEvent = (name: string, props: Props = {}) => {
  if (typeof window === "undefined") return;
  const payload: Props = {
    ...props,
    session_id: getSessionId(),
    surface: surface(),
  };
  touchSession();
  const send = () => {
    try {
      window.gtag?.("event", name, payload);
    } catch {
      /* ignore */
    }
    try {
      window.posthog?.capture(name, payload);
    } catch {
      /* ignore */
    }
    // Local hook so other parts of the app (or Lovable native analytics) can
    // observe events without another provider SDK.
    try {
      window.dispatchEvent(new CustomEvent("bb:analytics", { detail: { name, payload } }));
    } catch {
      /* ignore */
    }
  };
  // Keep tracking off the critical rendering path.
  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, o?: unknown) => void })
      .requestIdleCallback(send, { timeout: 1200 });
  } else {
    window.setTimeout(send, 0);
  }
};

/**
 * Record a page/screen view. Deduped on path+search+title so React re-renders,
 * StrictMode double-effects and redundant history events never double count.
 */
export const trackPageView = (opts: { path: string; title: string; extra?: Props } ) => {
  const key = `${opts.path}|${opts.title}`;
  const s = state();
  if (s.lastKey === key) return;
  s.lastKey = key;
  trackEvent("page_view", {
    page_path: opts.path,
    page_title: opts.title,
    page_location: `${window.location.origin}${opts.path}`,
    screen_name: opts.title,
    referrer: document.referrer || undefined,
    ...opts.extra,
  });
};

/** Human-readable screen name for a route path. */
export const screenNameFor = (pathname: string): string => {
  const exact: Record<string, string> = {
    "/": "Home",
    "/home": "Home",
    "/search": "Search",
    "/movies": "Movies",
    "/tv": "TV Shows",
    "/anime": "Anime",
    "/live-tv": "Live TV",
    "/watch": "Shorts",
    "/library": "Library",
    "/my-downloads": "Downloads",
    "/downloads": "Downloads",
    "/my-list": "Watchlist",
    "/liked": "Liked",
    "/profile": "Profile",
    "/settings": "Settings",
    "/podcasts": "Podcasts",
    "/animation": "Animation",
    "/documentary": "Documentary",
    "/install": "Install App",
    "/blog": "Blog",
    "/help": "Help",
    "/contact": "Contact",
    "/privacy": "Privacy",
    "/terms": "Terms",
  };
  if (exact[pathname]) return exact[pathname];

  const seg = pathname.split("/").filter(Boolean);
  if (seg[0] === "watch" && seg[1] === "movie") return "Watch Movie";
  if (seg[0] === "watch" && seg[1] === "tv") return "Watch Episode";
  if (seg[0] === "watch") return "Watch Video";
  if (seg[0] === "movie") return seg[2] === "watch" ? "Watch Movie" : "Movie Details";
  if (seg[0] === "tv") return "Series Details";
  if (seg[0] === "anime") return "Anime Details";
  if (seg[0] === "genre") return `Genre: ${decodeURIComponent(seg[1] || "")}`;
  if (seg[0] === "live") return "Live Channel";
  if (seg[0] === "download") return "Download";
  if (seg[0] === "blog") return "Blog Post";
  if (seg.length === 0) return "Home";
  return seg
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" · ");
};

/** Watch-specific event so each movie/episode view is attributable. */
export const trackMediaView = (media: {
  type: "movie" | "tv" | "live" | "video";
  id: string;
  title?: string;
  season?: number;
  episode?: number;
}) => {
  trackEvent("media_view", {
    media_type: media.type,
    media_id: media.id,
    media_title: media.title,
    season: media.season,
    episode: media.episode,
  });
};

/** Search event with the normalized query. */
export const trackSearch = (query: string, resultCount?: number) => {
  const q = query.trim();
  if (!q) return;
  trackEvent("search", { search_term: q.toLowerCase(), result_count: resultCount });
};
