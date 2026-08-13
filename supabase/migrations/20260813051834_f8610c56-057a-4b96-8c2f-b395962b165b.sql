CREATE TABLE IF NOT EXISTS public.video_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('movie','tv','episode','anime')),
  season_number integer,
  episode_number integer,
  source_name text NOT NULL,
  stream_url text NOT NULL,
  quality text,
  language text DEFAULT 'en',
  subtitle_url text,
  headers jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 100,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS video_streams_unique_source
  ON public.video_streams (content_id, content_type, COALESCE(season_number, -1), COALESCE(episode_number, -1), source_name);

CREATE INDEX IF NOT EXISTS video_streams_lookup
  ON public.video_streams (content_id, content_type, season_number, episode_number, is_active, priority);

GRANT SELECT ON public.video_streams TO anon;
GRANT SELECT ON public.video_streams TO authenticated;
GRANT ALL ON public.video_streams TO service_role;

ALTER TABLE public.video_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active valid streams"
  ON public.video_streams
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_video_streams_updated_at ON public.video_streams;
CREATE TRIGGER update_video_streams_updated_at
  BEFORE UPDATE ON public.video_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();