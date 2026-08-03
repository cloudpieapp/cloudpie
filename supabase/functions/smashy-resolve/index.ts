// smashy-resolve
// Resolves a TMDB movie / TV episode into playable SmashyStream sources
// (HLS or MP4) so BingBloom can play them natively — no iframes, no redirects.
//
// POST { tmdbId, type: "movie" | "tv", season?, episode? }
//   -> { ok: true, streams: [{ label, url, kind: "hls" | "mp4" }], captions: [] }
//   -> { ok: false, reason }
//
// GET ?m3u8=<absolute playlist url>
//   -> the playlist with every relative URI rewritten to an absolute URL that
//      is routed through the `proxy` edge function, so hls.js can play a
//      cross-origin playlist from the browser.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const TMDB_KEY = Deno.env.get("TMDB_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SMASHY = "https://embed.smashystream.com";

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}

// ---------- SSRF guard ----------
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const o = m.slice(1).map(Number);
    if (o.some((n) => n > 255)) return true;
    const [a, b] = o;
    if (a === 0 || a === 127 || a === 10) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
  }
  return false;
}

function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return !!u.hostname && !isBlockedHost(u.hostname);
  } catch {
    return false;
  }
}

function proxied(url: string): string {
  return `${SUPABASE_URL}/functions/v1/proxy?url=${encodeURIComponent(url)}`;
}

function playlistProxied(url: string): string {
  return `${SUPABASE_URL}/functions/v1/smashy-resolve?m3u8=${encodeURIComponent(url)}`;
}

// ---------- TMDB -> IMDb ----------
async function imdbIdFor(tmdbId: string, type: "movie" | "tv"): Promise<string> {
  if (!TMDB_KEY) return "";
  try {
    const r = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${TMDB_KEY}`);
    if (!r.ok) return "";
    const d = await r.json();
    return typeof d?.imdb_id === "string" ? d.imdb_id : "";
  } catch {
    return "";
  }
}

// ---------- Extract playable urls from an arbitrary JSON/HTML payload ----------
function extractUrls(text: string): string[] {
  const out = new Set<string>();
  // JSON `sourceUrls` array or `file`/`url`/`src` keys.
  const quoted = text.match(/https?:\\?\/\\?\/[^"'\\\s]+\.(?:m3u8|mp4)(?:\?[^"'\\\s]*)?/gi) || [];
  for (const raw of quoted) {
    const clean = raw.replace(/\\\//g, "/");
    if (isSafeUrl(clean)) out.add(clean);
  }
  return Array.from(out);
}

function labelFor(url: string, i: number): string {
  const q = url.match(/(\d{3,4})p/);
  if (q) return `${q[1]}p`;
  return `FastStream ${i + 1}`;
}

async function tryEndpoint(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Referer: `${SMASHY}/`,
        Accept: "*/*",
      },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return extractUrls(text);
  } catch {
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ----- HLS playlist rewriting (GET) -----
  if (req.method === "GET") {
    const target = new URL(req.url).searchParams.get("m3u8") || "";
    if (!target || !isSafeUrl(target)) {
      return json({ ok: false, reason: "Invalid playlist url" }, 400);
    }
    try {
      const upstream = await fetch(target, {
        headers: { "User-Agent": UA, Referer: `${SMASHY}/`, Accept: "*/*" },
      });
      if (!upstream.ok) return json({ ok: false, reason: `Upstream ${upstream.status}` }, 502);
      const body = await upstream.text();
      const base = new URL(target);
      const rewritten = body
        .split("\n")
        .map((line) => {
          const t = line.trim();
          if (!t) return line;
          if (t.startsWith("#")) {
            // Rewrite URI="..." attributes (keys, media playlists).
            return line.replace(/URI="([^"]+)"/g, (_m, u) => {
              try {
                const abs = new URL(u, base).toString();
                return `URI="${u.endsWith(".m3u8") ? playlistProxied(abs) : proxied(abs)}"`;
              } catch {
                return _m;
              }
            });
          }
          try {
            const abs = new URL(t, base).toString();
            return t.includes(".m3u8") ? playlistProxied(abs) : proxied(abs);
          } catch {
            return line;
          }
        })
        .join("\n");
      return new Response(rewritten, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "public, max-age=15",
        },
      });
    } catch {
      return json({ ok: false, reason: "Playlist fetch failed" }, 502);
    }
  }

  if (req.method !== "POST") return json({ ok: false, reason: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const tmdbId = String(body?.tmdbId || "").trim();
    const type = body?.type === "tv" ? "tv" : "movie";
    const season = Number.isFinite(+body?.season) ? Math.max(1, +body.season) : 1;
    const episode = Number.isFinite(+body?.episode) ? Math.max(1, +body.episode) : 1;

    if (!/^\d{1,12}$/.test(tmdbId)) return json({ ok: false, reason: "Invalid tmdbId" }, 400);

    const imdb = await imdbIdFor(tmdbId, type);
    const epQs = type === "tv" ? `&season=${season}&episode=${episode}` : "";

    // SmashyStream exposes several provider endpoints; each returns JSON or
    // HTML containing direct .m3u8 / .mp4 urls. Try them in order of quality.
    const candidates: string[] = [];
    for (const path of ["videoD.php", "videoe.php", "video1c.php", "videoY.php", "playere.php"]) {
      candidates.push(`${SMASHY}/${path}?tmdb=${tmdbId}${epQs}`);
      if (imdb) candidates.push(`${SMASHY}/${path}?imdb=${imdb}${epQs}`);
    }

    const found: { label: string; url: string; kind: "hls" | "mp4" }[] = [];
    const seen = new Set<string>();
    for (const endpoint of candidates) {
      const urls = await tryEndpoint(endpoint);
      for (const u of urls) {
        if (seen.has(u)) continue;
        seen.add(u);
        const isHls = u.split("?")[0].toLowerCase().endsWith(".m3u8");
        found.push({
          label: labelFor(u, found.length),
          url: isHls ? playlistProxied(u) : proxied(u),
          kind: isHls ? "hls" : "mp4",
        });
      }
      if (found.length >= 4) break;
    }

    if (found.length === 0) {
      return json({ ok: false, reason: "SmashyStream has no source for this title yet." });
    }

    return json({ ok: true, streams: found.slice(0, 6), captions: [] });
  } catch (e) {
    return json({ ok: false, reason: "SmashyStream resolver error" });
  }
});
