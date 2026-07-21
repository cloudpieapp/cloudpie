# 10-Task Implementation Plan

A single-pass rollout covering the player, downloads, Live TV, home brand rail, and search. Each task is scoped so it can be shipped together in one go.

---

### Task 1 — Compact Quality dropdown on mobile
- In `MoviePlayer.tsx`, replace the full-screen Quality overlay on small screens (`sm:` breakpoint) with a small anchored dropdown (Radix `DropdownMenu`) opening below the Quality button.
- Keep the labeled "Quality" button; dropdown shows 1080p / 720p / 480p with a check on the active one.
- Same pattern reused for Subtitles button (small anchored dropdown listing full language names + Off).
- Persist selection as today.

### Task 2 — Player gestures & in-app control buttons
- Add tap zones over the video:
  - Double-tap right → +10s, double-tap left → −10s (with a brief arrow+seconds pill).
  - Left-edge vertical swipe → brightness overlay (CSS filter on the video for web; Capacitor `@capacitor-community/screen-brightness` when running native).
  - Right-edge vertical swipe → app volume (video element `volume`).
- Toolbar buttons: Previous episode, Play/Pause, Next episode, plus a small "Preview" button that shows the next-episode still on hover/tap.
- Buttons hidden when no series context (movies just show Play/Pause + seek).

### Task 3 — Replace "app has ads" CTA with Follow-channel CTA
- Remove the ads-notice CTA everywhere it renders.
- Add a slim banner: "We just hit 100 followers — help us grow, follow our channel." Button opens WhatsApp channel URL via `window.open` (Capacitor `Browser.open` on native). Stored dismissal in `localStorage` for 7 days.

### Task 4 — Downloads: bundle subtitles + offline subtitle playback
- In `DownloadSourceSheet` / `offlineDownloads.ts`:
  - When starting a download, also fetch every caption from the MovieBox result, convert SRT→VTT, and store each as a Blob in a new `subtitles` IndexedDB store keyed by `videoId + lang`.
  - Extend `OfflineVideo` with `subtitles: {lang, label}[]`.
- In the offline player (downloads player), add the same Subtitles dropdown; tracks are built from IndexedDB blobs via `URL.createObjectURL`.

### Task 5 — Downloads page: 3-dot menu + Sort + grouped ordering
- Replace inline Delete/Queue buttons on each row with a single `⋮` `DropdownMenu` containing: Play, Pause/Resume (queue), Delete, Share.
- Add a top toolbar: **Sort** dropdown (Recently added, Title A–Z, Size, Category) and **Category** chips (Movies, Series, Anime).
- Series episodes: group by `seriesTitle`, expandable folders; inside a folder, sort by `season` then `episode` ascending (S1E1 → S1E2 → S2E1…).

### Task 6 — Downloads player: auto-next episode + Recommendations rail
- After a downloaded episode ends, look up the same series' next `(season, episode)` in IndexedDB and autoplay it (respect the existing autoplay setting + countdown card).
- Below the offline player, render a "More like this" rail. Data source: `useEnrichedMetadata` recommendations for the tmdbId, cached to `localStorage` (`bb:recs:v1:<type>-<id>`, 7-day TTL). When offline, read from cache; hide rail if empty.

### Task 7 — Live TV page redesigned as logo cards
- Rebuild `LiveTVPage.tsx` grid: rounded cards with the channel's official logo centered on a brand-tinted background, name below, "LIVE" pill.
- Use lovable-assets pointers already in `src/assets/livetv/` and add missing ones (BBC News, CNN, Fox News, Bloomberg, Amazon Prime, Netflix, Disney+, Tubi, DreamWorks, IMAX) from the uploaded reference images via `lovable-assets create` so they're CDN-cached.
- Preserve current playback wiring; only the card presentation changes.

### Task 8 — 50 free YouTube live channels via Piped
- Extend `src/lib/piped.ts` with `getLiveChannel(handle)` and a curated `FREE_LIVE_CHANNELS` array (50 entries: news, sports, music, kids, docs — reusing the prior list).
- New `useLiveChannels()` hook resolves each channel's current live stream (HLS URL) through the existing `piped-proxy` edge function; cached in React Query for 5 min.
- Live TV page merges IPTV channels (existing) + Piped channels into the same card grid; each card tags its source.

### Task 9 — Home page "Streaming Universe" rail
- New `StreamingBrandsRow` on `HomePage.tsx` showing Netflix, Amazon Prime, Tubi, Disney+, DreamWorks, IMAX as logo cards (uses the same cached asset pointers from Task 7).
- Tapping a card routes to `/search?provider=netflix` (etc.).

### Task 10 — Smarter search: never blank + provider filter + related fallback
- In `SearchPage.tsx`:
  - Read `provider` query param; when present, filter TMDB results by `with_watch_providers` (TMDB provider IDs mapped: Netflix 8, Prime 9, Disney+ 337, Tubi 73, etc.) and label the header ("Netflix picks").
  - Empty query → render Trending + "Because you watched" (from Continue Watching seeds) + Top by genre so the page is never blank.
  - Non-empty query with 0 exact hits → fall back to TMDB `search/multi` with fuzzy tokens + `discover` by inferred genre keyword so related results still show, under a "Related results" heading.
  - Debounce 250ms, cache queries in React Query.

---

## Technical notes
- New/changed files: `MoviePlayer.tsx`, `OfflinePlayer` (extract), `offlineDownloads.ts` (+ subtitles store, schema bump to v2), `MyDownloadsPage.tsx`, `LiveTVPage.tsx`, `HomePage.tsx`, `SearchPage.tsx`, `src/lib/piped.ts`, `src/lib/liveChannels.ts` (new), `src/components/StreamingBrandsRow.tsx` (new), `src/components/FollowChannelBanner.tsx` (new).
- IndexedDB migration: bump `DB_VERSION` to 2, add `subtitles` store, backfill `subtitles: []` on existing rows.
- Gestures implemented with plain pointer events (no new deps). Brightness on native only when Capacitor is present.
- All new brand logos uploaded via `lovable-assets` so they're CDN-cached and available offline through the service worker.
- Recommendations cache keyed per title in `localStorage`; SW `public/sw.js` already caches API GETs — recs will be re-served offline.

Approve and I'll implement all ten in one pass.
