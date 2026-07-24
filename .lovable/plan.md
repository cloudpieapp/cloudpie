## Scope

Four connected changes covering Live TV, Home, and the Offline (Downloads) player.

### 1. Rebuild TV/Live TV page — cards only

- Replace the current split layout (globe visual + sidebar + partial guide) with a single, full-width **card grid** showing every channel.
- Card: big logo tile (4:3), name, small "LIVE" chip, category label. No sidebar, no globe.
- Above the grid: search input + horizontal category chips (All, Favorites, News, Sports, Entertainment, Movies, YouTube, …).
- Tapping a card opens the existing `LiveChannelPlayer` in a full-width top slot; grid stays visible below for quick channel-hopping.
- Sources merged in one list:
  - IPTV-org / Free-TV verified HLS channels (existing `fetchIptvChannels`).
  - Curated sports channels (existing).
  - **All Piped YouTube live channels** — expand `src/lib/youtubeLive.ts` to include the 50 free live channels the user referenced (news, music, sports, kids categories) so they show up in the same grid with their official logos.
- Apply official-logo overrides (CNN, BBC, Fox, MSNBC, CNBC, Bloomberg + new ones for BBC News, Bloomberg2, CNN2, Fox News 2) via `applyOfficialLogo`.
- Cache channel logos: add a small in-memory + `localStorage` URL cache so logo `<img>` tags don't refetch on every mount.

### 2. Offline subtitles

Subtitles need to survive going offline and be selectable in the offline player.

- Extend `OfflineVideo` in `src/lib/offlineDownloads.ts` with `subtitles?: { lang: string; label: string; vtt: string }[]` — VTT text stored inline (small, plain text).
- When starting a download in `DownloadButton` / `DownloadSourceSheet`, also fetch the MovieBox subtitle list, convert SRT→VTT (reuse helper from `MoviePlayer`), and stash them on the meta record before/alongside the blob download.
- In the offline watch page (`WatchPage` / wherever `getDownloadBlobUrl` is used to play back), render `<track>` elements from `meta.subtitles` and add a **Subtitles** button (same UX as online player) to toggle Off / language. Persist selection under the existing `SUBTITLE_PREF_KEY`.

### 3. Offline recommendations

- On successful download completion, snapshot 12 related items (TMDB "similar" for movies/tv, or same-series episodes) into IndexedDB keyed by `videoId`.
- Below the offline player, render a "You might also like" row from that snapshot. If online, refresh in background; if offline, serve the cached snapshot.

### 4. Home page Live TV row

- New `LiveTvLogoRow` component: horizontal scroll of round/rounded-square logo tiles for the top ~15 channels (CNN, BBC, Fox News, MSNBC, CNBC, Bloomberg, Al Jazeera, DW, NHK, Sky News + top Piped YouTube channels).
- Uses the same asset logos under `src/assets/livetv/*` plus fetched IPTV-org logos.
- Tapping a tile navigates to `/live-tv?channel=<slug>` and auto-selects that channel.

### Files touched

```text
src/pages/LiveTVPage.tsx          rewrite as card grid
src/lib/youtubeLive.ts            expand to 50 curated YT live channels
src/lib/iptv.ts                   add more official-logo overrides + logo cache
src/lib/offlineDownloads.ts       add subtitles + recommendations fields
src/lib/savedDownloads.ts         helpers for offline recs snapshot (or new file)
src/components/DownloadButton.tsx
src/components/DownloadSourceSheet.tsx      fetch + attach subs on download
src/pages/WatchPage.tsx (offline path)      subtitle selector + recs row
src/components/LiveTvLogoRow.tsx  new home-page row
src/pages/HomePage.tsx            mount LiveTvLogoRow
```

### Out of scope / risks

- I will not touch the online MoviePlayer flow beyond exporting the SRT→VTT helper.
- Piped instances occasionally rate-limit; YouTube live channels remain iframe-embedded (no HLS conversion).
- Offline subtitles are limited to what MovieBox exposes at download time; nothing is fetched later.
