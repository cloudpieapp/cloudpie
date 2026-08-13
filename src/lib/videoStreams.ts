// Persistent stream-link cache backed by the `video_streams` Postgres table.
//
// Lookup order for every playback request:
//   1. read video_streams (active + not expired, ordered by priority)
//   2. if empty -> resolve from the external source, then save via the
//      `record-stream` edge function (service role; the table is read-only for
//      normal users)
//
// The table is managed directly from the Supabase Table Editor — there is no
// frontend admin UI for it.

import { supabase } from "@/integrations/supabase/client";
import { db } from "@/integrations/supabase/db";

export type StreamContentType = "movie" | "tv" | "episode" | "anime";

export interface VideoStream {
  id: string;
  content_id: string;
  content_type: StreamContentType;
  season_number: number | null;
  episode_number: number | null;
  source_name: string;
  stream_url: string;
  quality: string | null;
  language: string | null;
  subtitle_url: string | null;
  headers: Record<string, string> | null;
  is_active: boolean;
  priority: number;
  expires_at: string | null;
}

export interface StreamKey {
  contentId: string | number;
  contentType: StreamContentType;
  season?: number | null;
  episode?: number | null;
}

/** Active, unexpired streams for a movie / episode, best (lowest priority) first. */
export async function getStoredStreams(key: StreamKey): Promise<VideoStream[]> {
  try {
    let q = db
      .from("video_streams")
      .select("*")
      .eq("content_id", String(key.contentId))
      .eq("content_type", key.contentType)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    q = key.season == null ? q.is("season_number", null) : q.eq("season_number", key.season);
    q = key.episode == null ? q.is("episode_number", null) : q.eq("episode_number", key.episode);

    const { data, error } = await q;
    if (error || !data) return [];
    const now = Date.now();
    return (data as VideoStream[]).filter(
      (s) => !s.expires_at || new Date(s.expires_at).getTime() > now,
    );
  } catch {
    return [];
  }
}

export interface SaveStreamInput {
  source_name: string;
  stream_url: string;
  quality?: string | null;
  language?: string | null;
  subtitle_url?: string | null;
  headers?: Record<string, string> | null;
  priority?: number;
  expires_at?: string | null;
}

/** Persist freshly resolved streams so later requests skip the external source. */
export async function saveStreams(key: StreamKey, streams: SaveStreamInput[]) {
  if (!streams.length) return;
  try {
    await supabase.functions.invoke("record-stream", {
      body: {
        contentId: String(key.contentId),
        contentType: key.contentType,
        season: key.season ?? null,
        episode: key.episode ?? null,
        streams,
      },
    });
  } catch {
    /* caching is best-effort — never block playback */
  }
}
