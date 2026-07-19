// Client helper for the "Fast Downloads" source (MovieBox via the
// moviebox-resolve edge function). Resolves direct MP4 URLs and wraps them in
// the proxy edge function so the browser can fetch them (the CDN requires a
// Referer header the browser cannot set).
import { supabase } from "@/integrations/supabase/client";

export interface MovieboxDownload {
  resolution: number; // 1080 / 720 / 480 / 360
  url: string;
  size: number; // bytes
  format: string;
}

export interface MovieboxCaption {
  lang: string;
  url: string;
}

export interface MovieboxResult {
  ok: boolean;
  reason?: string;
  title?: string;
  year?: string;
  poster?: string | null;
  downloads?: MovieboxDownload[];
  captions?: MovieboxCaption[];
}

export interface ResolveArgs {
  title: string;
  year?: string;
  mediaType: "movie" | "tv" | "anime";
  season?: number;
  episode?: number;
}

export async function resolveMovieboxDownloads(args: ResolveArgs): Promise<MovieboxResult> {
  const key = cacheKey(args);
  const cached = readCache(key);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.functions.invoke("moviebox-resolve", {
      body: {
        title: args.title,
        year: args.year,
        mediaType: args.mediaType,
        season: args.season ?? 0,
        episode: args.episode ?? 0,
      },
    });
    if (error) return { ok: false, reason: "Fast Downloads is unavailable right now." };
    const result = data as MovieboxResult;
    if (result?.ok && result.downloads?.length) writeCache(key, result);
    return result;
  } catch {
    return { ok: false, reason: "Fast Downloads is unavailable right now." };
  }
}

// ---------- Cache ----------
// Cache successful MovieBox resolves per (title, year, type, season, episode)
// for 6 hours. Cuts the "loading stream" wait on repeat plays (autoplay next
// episode, back/forward navigation) from ~2-4s down to instant.
const CACHE_PREFIX = "bb:mb:v1:";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const memCache = new Map<string, { at: number; value: MovieboxResult }>();

function cacheKey(a: ResolveArgs): string {
  return `${CACHE_PREFIX}${a.mediaType}|${(a.title || "").toLowerCase().trim()}|${a.year || ""}|${a.season ?? 0}|${a.episode ?? 0}`;
}

function readCache(key: string): MovieboxResult | null {
  const hit = memCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; value: MovieboxResult };
    if (!parsed?.at || Date.now() - parsed.at > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    memCache.set(key, parsed);
    return parsed.value;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: MovieboxResult) {
  const entry = { at: Date.now(), value };
  memCache.set(key, entry);
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    /* quota — ignore */
  }
}

// Wrap a MovieBox CDN URL through the proxy edge function (adds the required
// Referer + permissive CORS so the browser can download/stream it).
export function movieboxProxyUrl(url: string): string {
  const ref = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${ref}.supabase.co/functions/v1/proxy?url=${encodeURIComponent(url)}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

export function resolutionLabel(res: number): string {
  if (res >= 2160) return "4K";
  if (res >= 1080) return "1080p Full HD";
  if (res >= 720) return "720p HD";
  if (res >= 480) return "480p";
  if (res >= 360) return "360p";
  return `${res}p`;
}
