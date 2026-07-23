# 10-Task Single-Pass Plan

Everything below ships in one go. No task is optional.

---

### Task 1 — Player gestures + in-app controls

- `MoviePlayer.tsx`: add pointer-event tap zones over the `<video>`:
  - Double-tap right half → +10s, left half → −10s, with a brief centered pill showing arrow + `10s`.
  - Left edge (0–15% width) vertical swipe → brightness overlay (CSS `filter: brightness()` on web; `@capacitor-community/screen-brightness` when `Capacitor.isNativePlatform()`).
  - Right edge (85–100%) vertical swipe → `video.volume`.
- Toolbar row: Previous ep · Play/Pause · Next ep · Preview (hover/tap shows next-episode still from TMDB). Ep buttons hidden if no series context.
- Remove the Follow-channel banner and all remaining ad CTAs from the player surface.

### Task 2 — Resume position persistence

- New `src/lib/resumePositions.ts`: `getResume(id)`, `setResume(id, seconds, duration)` backed by `localStorage` key `bb:resume:v1`.
- `MoviePlayer.tsx` writes every 5s while playing (both online + offline players), and on `pause`/`ended`/`beforeunload`.
- On mount, seek to saved position if `>15s` and `<95%` of duration; clear on `ended`.
- Applies to movie, TV episode (per season/episode id), and offline downloads.



### Task 4 — Downloads: bundle subtitles + offline subtitle playback

- `offlineDownloads.ts`: bump `DB_VERSION` to `2`, add `subtitles` store (key `[videoId, lang]`), extend `OfflineVideo` with `subtitles: {lang, label}[]`, backfill `[]` on existing rows in `onupgradeneeded`.
- `DownloadSourceSheet` / start flow: fetch every MovieBox caption, SRT→VTT via existing helper, store Blob per lang.
- Extract offline player from `MyDownloadsPage.tsx` into `src/components/OfflinePlayer.tsx`. Add the same labeled Subtitles dropdown; tracks built from IndexedDB blobs via `URL.createObjectURL`. Resume position applies here too.

### Task 5 — Downloads page: 3-dot menu, sort, grouped series

- Row action becomes a single `⋮` `DropdownMenu` → Play · Pause/Resume · **Delete** · Share. No inline delete/queue buttons.
- Top toolbar: **Sort** (Recently added, Title A–Z, Size, Category) + **Category** chips (Movies, Series, Anime).
- Series episodes grouped under expandable `seriesTitle` folder; inside a folder, sort ascending by `season` then `episode` (S1E1 → S1E2 → S2E1…) — top-to-bottom order feeds auto-next.

### Task 6 — Offline player auto-next + recommendations rail

- On `ended`, look up next `(season, episode)` for same `seriesTitle` in IndexedDB and autoplay it (respect `autoplay` setting + existing countdown card).
- Below the player: `PlayerRecommendations`-style rail sourced from `useEnrichedMetadata` recs for the tmdbId, cached to `localStorage` (`bb:recs:v1:<type>-<id>`, 7-day TTL). Offline reads from cache; hide if empty.

### Task 7 — Live TV: full iptv-org catalog + Piped + working cards

- New `src/lib/iptvOrg.ts`: fetch `https://iptv-org.github.io/iptv/index.m3u` through the existing `proxy` edge function, parse into `{ name, logo, group, country, url, id }[]`, cache in `localStorage` for 24h.
- Extend `src/lib/piped.ts` with `getLiveChannel(handle)` and `FREE_LIVE_CHANNELS` (50 curated handles: news/sports/music/kids/docs).
- New `src/hooks/useLiveChannels.ts` merges iptv-org + Piped-resolved HLS URLs (5-min React Query cache) into one `LiveChannel` list, each tagged `source: 'iptv' | 'youtube'`.
- Rebuild `LiveTVPage.tsx` as a `ContentCard`-style grid: rounded card, official logo centered on brand-tinted bg, name below, `LIVE` pill, source tag. Category chips by iptv-org `group`, search box, country filter.
- Each card: **Play** (existing playback wiring preserved) and **Hide stream** (⋮ menu) → persists hidden ids in `localStorage` (`bb:live:hidden:v1`), filtered out of the grid; a small "Show hidden (N)" toggle re-reveals.
- Upload any still-missing brand/channel logos via `lovable-assets create` so they're CDN-cached and SW-served offline.

### Task 8 — Home "Streaming Universe" rail (finalize)

- `StreamingBrandsRow` already created; ensure it renders on `HomePage.tsx`, uses cached brand asset pointers, and each card routes to `/search?provider=<slug>` (Netflix/Prime/Tubi/Disney+/DreamWorks/IMAX).

### Task 9 — Smarter search: never blank + provider + actor/cast

- `SearchPage.tsx`:
  - `provider` query param → TMDB discover with `with_watch_providers` (Netflix 8, Prime 9, Disney+ 337, Tubi 73, HBO 384, Apple TV+ 350); header reads "Netflix picks" etc.
  - Empty query → Trending + "Because you watched" (Continue Watching seeds) + Top-by-genre. Never blank.
  - Non-empty query: run `search/multi`. If it returns a **person**, fetch `person/{id}/combined_credits` and render an "Movies & shows with {name}" grid alongside title results.
  - Zero title hits → fuzzy `search/multi` + genre-inferred `discover` under "Related results".
  - 250ms debounce, React Query cached.

### Task 10 — Cast tap → filmography

- `TmdbCastSection.tsx` / `CastSection.tsx`: each cast avatar becomes a link to `/search?person=<personId>&name=<encoded>`.
- `SearchPage.tsx` reads `person` param: fetch `person/{id}/combined_credits`, sort by popularity, render grid with header "Movies & shows with {name}". Reuses the same card grid as normal results.

---

## Technical notes

- New files: `src/lib/resumePositions.ts`, `src/lib/iptvOrg.ts`, `src/hooks/useLiveChannels.ts`, `src/components/OfflinePlayer.tsx`.
- Changed files: `MoviePlayer.tsx`, `MyDownloadsPage.tsx`, `LiveTVPage.tsx`, `HomePage.tsx`, `SearchPage.tsx`, `offlineDownloads.ts`, `DownloadSourceSheet.tsx`, `piped.ts`, `TmdbCastSection.tsx`, `CastSection.tsx`, plus removal of ad CTA imports across the app.
- IndexedDB migration: v1→v2 adds `subtitles` store, backfills `subtitles: []` on existing `videos` rows in `onupgradeneeded`.
- Gestures use plain pointer events, no new deps. Capacitor brightness only when native.
- iptv-org M3U routed through existing `proxy` edge function to avoid CORS; parsed client-side; 24h localStorage cache.
- Hidden streams and resume positions live in `localStorage` so they survive reloads and offline.
- All new logos uploaded through `lovable-assets` for CDN + SW offline caching.

Approve and I'll implement all ten in one pass.