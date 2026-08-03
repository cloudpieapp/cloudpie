// Client helper for "FastStreams" (SmashyStream) — Source 2.
// Resolves native HLS / MP4 urls via the smashy-resolve edge function so the
// stream plays inside BingBloom's own player (no iframes, no redirects).
import { supabase } from "@/integrations/supabase/client";

export interface SmashyStreamOption {
  label: string;
  url: string;
  kind: "hls" | "mp4";
}

export interface SmashyResult {
  ok: boolean;
  reason?: string;
  streams?: SmashyStreamOption[];
}

export interface SmashyArgs {
  tmdbId: string;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
}

const CACHE_PREFIX = "bb:smashy:v1:";
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const mem = new Map<string, { at: number; value: SmashyResult }>();

function key(a: SmashyArgs) {
  return `${CACHE_PREFIX}${a.type}|${a.tmdbId}|${a.season ?? 0}|${a.episode ?? 0}`;
}

function read(k: string): SmashyResult | null {
  const hit = mem.get(k);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; value: SmashyResult };
    if (!parsed?.at || Date.now() - parsed.at > CACHE_TTL_MS) {
      localStorage.removeItem(k);
      return null;
    }
    mem.set(k, parsed);
    return parsed.value;
  } catch {
    return null;
  }
}

function write(k: string, value: SmashyResult) {
  const entry = { at: Date.now(), value };
  mem.set(k, entry);
  try {
    localStorage.setItem(k, JSON.stringify(entry));
  } catch {
    /* quota — ignore */
  }
}

export async function resolveSmashyStreams(args: SmashyArgs): Promise<SmashyResult> {
  const k = key(args);
  const cached = read(k);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.functions.invoke("smashy-resolve", {
      body: {
        tmdbId: args.tmdbId,
        type: args.type,
        season: args.season ?? 1,
        episode: args.episode ?? 1,
      },
    });
    if (error) return { ok: false, reason: "FastStreams is unavailable right now." };
    const result = data as SmashyResult;
    if (result?.ok && result.streams?.length) write(k, result);
    return result;
  } catch {
    return { ok: false, reason: "FastStreams is unavailable right now." };
  }
}
