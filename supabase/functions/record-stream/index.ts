// record-stream
// Public endpoint that caches resolved stream links into public.video_streams.
// Uses the service role because the table is read-only for normal users.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface StreamInput {
  source_name: string;
  stream_url: string;
  quality?: string | null;
  language?: string | null;
  subtitle_url?: string | null;
  headers?: Record<string, string> | null;
  priority?: number | null;
  expires_at?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const contentId = String(body?.contentId ?? body?.content_id ?? "");
    const contentType = String(body?.contentType ?? body?.content_type ?? "");
    const season = body?.season ?? body?.season_number ?? null;
    const episode = body?.episode ?? body?.episode_number ?? null;
    const streams: StreamInput[] = Array.isArray(body?.streams) ? body.streams : [];

    if (!contentId || contentId.length > 50) return json({ error: "invalid contentId" }, 400);
    if (!["movie", "tv", "episode", "anime"].includes(contentType)) {
      return json({ error: "invalid contentType" }, 400);
    }
    if (streams.length === 0) return json({ error: "no streams" }, 400);

    const rows = streams
      .filter(
        (s) =>
          typeof s?.stream_url === "string" &&
          /^https?:\/\//.test(s.stream_url) &&
          s.stream_url.length <= 4000 &&
          typeof s?.source_name === "string" &&
          s.source_name.length > 0 &&
          s.source_name.length <= 80,
      )
      .slice(0, 20)
      .map((s, i) => ({
        content_id: contentId,
        content_type: contentType,
        season_number: season === null ? null : Number(season) || null,
        episode_number: episode === null ? null : Number(episode) || null,
        source_name: s.source_name,
        stream_url: s.stream_url,
        quality: s.quality ?? null,
        language: s.language ?? "en",
        subtitle_url: s.subtitle_url ?? null,
        headers: s.headers ?? null,
        is_active: true,
        priority: typeof s.priority === "number" ? s.priority : 100 + i,
        expires_at: s.expires_at ?? null,
      }));

    if (rows.length === 0) return json({ error: "no valid streams" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("video_streams")
      .upsert(rows, {
        onConflict: "content_id,content_type,season_number,episode_number,source_name",
        ignoreDuplicates: false,
      });

    // The unique index uses COALESCE expressions, so onConflict may not match.
    // Fall back to delete-then-insert for this exact key.
    if (error) {
      let del = supabase
        .from("video_streams")
        .delete()
        .eq("content_id", contentId)
        .eq("content_type", contentType);
      del = season === null ? del.is("season_number", null) : del.eq("season_number", Number(season));
      del = episode === null ? del.is("episode_number", null) : del.eq("episode_number", Number(episode));
      await del;
      const { error: insErr } = await supabase.from("video_streams").insert(rows);
      if (insErr) return json({ error: insErr.message }, 400);
    }

    return json({ ok: true, saved: rows.length }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
