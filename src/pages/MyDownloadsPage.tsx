import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, ChevronLeft, Search, Trash2, CloudDownload, X, Pause, Loader2, Folder, ChevronDown, PlayCircle, Expand, MoreVertical, ArrowUpDown, Subtitles } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import { getAllDownloads, deleteDownload, getDownloadBlobUrl, pauseDownload, resumeDownload, type OfflineVideo } from "@/lib/offlineDownloads";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

function fmtMB(bytes: number) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(0)} MB`;
}

interface SeriesFolder {
  key: string;
  tmdbId: string;
  title: string;
  poster?: string | null;
  episodes: OfflineVideo[];
}

type SortKey = "recent" | "title" | "size";
type Category = "all" | "movies" | "tv" | "anime";

const MyDownloadsPage = () => {
  const [offline, setOffline] = useState<OfflineVideo[]>([]);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState<OfflineVideo | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [category, setCategory] = useState<Category>("all");
  const [subtitleLang, setSubtitleLang] = useState<string>(() => {
    try { return localStorage.getItem("bb:subtitle-pref") || "off"; } catch { return "off"; }
  });
  const [subtitleMenuOpen, setSubtitleMenuOpen] = useState(false);
  const [subtitleTrackUrls, setSubtitleTrackUrls] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const playOffline = async (v: OfflineVideo) => {
    const url = await getDownloadBlobUrl(v.id);
    if (!url) { toast.error("This download isn't ready yet."); return; }
    setPlaying(v);
    setPlayUrl(url);
  };

  const closePlayer = () => {
    if (playUrl) URL.revokeObjectURL(playUrl);
    Object.values(subtitleTrackUrls).forEach((u) => URL.revokeObjectURL(u));
    setSubtitleTrackUrls({});
    setPlayUrl(null);
    setPlaying(null);
  };

  const refresh = async () => {
    try { setOffline(await getAllDownloads()); } catch { setOffline([]); }
  };

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 3000);
    return () => clearInterval(i);
  }, []);

  const removeOne = async (id: string) => {
    await deleteDownload(id);
    toast.success("Removed");
    refresh();
  };

  const removeFolder = async (folder: SeriesFolder) => {
    await Promise.all(folder.episodes.map((e) => deleteDownload(e.id)));
    toast.success("Series removed");
    refresh();
  };

  const { movies, folders } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => (!q ? true : s.toLowerCase().includes(q));
    const movieList: OfflineVideo[] = [];
    const folderMap = new Map<string, SeriesFolder>();

    for (const v of offline) {
      if (category !== "all" && v.type !== category) continue;
      if (v.type === "tv") {
        const key = `tv-${v.tmdbId}`;
        const name = v.seriesTitle || v.title;
        if (!match(name) && !match(v.title)) continue;
        let f = folderMap.get(key);
        if (!f) {
          f = { key, tmdbId: v.tmdbId, title: name, poster: v.poster, episodes: [] };
          folderMap.set(key, f);
        }
        if (!f.poster && v.poster) f.poster = v.poster;
        f.episodes.push(v);
      } else {
        if (match(v.title)) movieList.push(v);
      }
    }

    const folderList = Array.from(folderMap.values());
    // Episodes inside a folder always play in canonical season/episode order.
    folderList.forEach((f) =>
      f.episodes.sort((a, b) => (a.season ?? 0) - (b.season ?? 0) || (a.episode ?? 0) - (b.episode ?? 0)),
    );
    // Apply outer sort
    const cmp = (a: { title: string; size: number; updatedAt: number }, b: typeof a) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "size") return b.size - a.size;
      return b.updatedAt - a.updatedAt;
    };
    movieList.sort(cmp);
    folderList.sort((a, b) => cmp(
      { title: a.title, size: a.episodes.reduce((n, e) => n + e.size, 0), updatedAt: Math.max(...a.episodes.map((e) => e.updatedAt)) },
      { title: b.title, size: b.episodes.reduce((n, e) => n + e.size, 0), updatedAt: Math.max(...b.episodes.map((e) => e.updatedAt)) },
    ));
    return { movies: movieList, folders: folderList };
  }, [offline, query, category, sortBy]);

  const empty = movies.length === 0 && folders.length === 0;

  // Suggested-next queue for the offline player (all other ready items)
  const suggestions = useMemo(() => {
    if (!playing) return [];
    return offline.filter((v) => v.status === "ready" && v.id !== playing.id).slice(0, 20);
  }, [offline, playing]);

  // Auto-next: if this is a TV episode, jump to the next episode of the same
  // series that's ready offline (S/E order). Falls back to first ready suggestion.
  const playNext = () => {
    if (playing?.type === "tv") {
      const sameSeries = offline
        .filter((v) => v.type === "tv" && v.tmdbId === playing.tmdbId && v.status === "ready" && v.id !== playing.id)
        .sort((a, b) => (a.season ?? 0) - (b.season ?? 0) || (a.episode ?? 0) - (b.episode ?? 0));
      const next = sameSeries.find(
        (v) => (v.season ?? 0) > (playing.season ?? 0) ||
              ((v.season ?? 0) === (playing.season ?? 0) && (v.episode ?? 0) > (playing.episode ?? 0)),
      ) || sameSeries[0];
      if (next) { playOffline(next); return; }
    }
    if (suggestions[0]) playOffline(suggestions[0]);
  };

  const enterFullscreen = () => {
    const v = document.getElementById("offline-video") as HTMLVideoElement | null;
    if (!v) return;
    (v.requestFullscreen?.() ||
      // @ts-ignore
      v.webkitEnterFullscreen?.())?.catch?.(() => {});
  };

  // Build blob URLs for each stored VTT subtitle when the player opens.
  useEffect(() => {
    if (!playing?.subtitles?.length) {
      setSubtitleTrackUrls({});
      return;
    }
    const map: Record<string, string> = {};
    for (const s of playing.subtitles) {
      map[s.lang] = URL.createObjectURL(new Blob([s.vtt], { type: "text/vtt" }));
    }
    setSubtitleTrackUrls(map);
    return () => {
      Object.values(map).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [playing]);

  // Toggle the chosen track between "showing" and "disabled" every time it changes.
  useEffect(() => {
    const v = document.getElementById("offline-video") as HTMLVideoElement | null;
    if (!v) return;
    const t = v.textTracks;
    for (let i = 0; i < t.length; i++) {
      const langCode = (t[i] as any).language || t[i].label;
      t[i].mode = subtitleLang !== "off" && langCode === subtitleLang ? "showing" : "disabled";
    }
  }, [subtitleLang, subtitleTrackUrls, playUrl]);

  const pickSubtitle = (lang: string) => {
    setSubtitleLang(lang);
    try { localStorage.setItem("bb:subtitle-pref", lang); } catch { /* ignore */ }
    setSubtitleMenuOpen(false);
  };

  const renderRow = (v: OfflineVideo, indent = false) => {
    const pct = v.size > 0 ? Math.min(100, Math.round((v.downloaded / v.size) * 100)) : 0;
    const ready = v.status === "ready";
    const downloading = v.status === "downloading" || v.status === "queued";
    return (
      <li key={v.id} className={`flex items-center gap-3 p-2 rounded-xl bg-card ${indent ? "ml-3" : ""}`}>
        <button
          onClick={() => ready && playOffline(v)}
          className="relative w-[58px] h-[78px] rounded-lg overflow-hidden bg-black flex-shrink-0 group"
        >
          {v.poster && <img src={v.poster} alt={v.title} loading="lazy" className="w-full h-full object-cover" />}
          {ready && (
            <span className="absolute inset-0 grid place-items-center bg-black/30">
              <Play className="w-5 h-5 text-white fill-white" />
            </span>
          )}
          {downloading && (
            <span className="absolute inset-0 grid place-items-center bg-black/50">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </span>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-foreground truncate">
            {indent && v.episode ? `Episode ${v.episode}` : v.title}
          </h3>
          {ready ? (
            <p className="text-[10px] text-emerald-500 mt-0.5">Available offline · {fmtMB(v.size)}</p>
          ) : v.status === "error" ? (
            <p className="text-[10px] text-primary mt-0.5">Download failed</p>
          ) : v.status === "paused" ? (
            <p className="text-[10px] text-muted-foreground mt-0.5">Paused · {pct}%</p>
          ) : (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Downloading · {pct}% {v.size ? `of ${fmtMB(v.size)}` : ""}
            </p>
          )}
          {!ready && v.status !== "error" && (
            <div className="mt-1.5 h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 text-muted-foreground hover:text-foreground" aria-label="More options">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {ready && (
              <DropdownMenuItem onClick={() => playOffline(v)}>
                <Play className="w-3.5 h-3.5 mr-2" /> Play
              </DropdownMenuItem>
            )}
            {downloading && (
              <DropdownMenuItem onClick={() => pauseDownload(v.id)}>
                <Pause className="w-3.5 h-3.5 mr-2" /> Pause (queue)
              </DropdownMenuItem>
            )}
            {(v.status === "paused" || v.status === "error") && (
              <DropdownMenuItem onClick={() => { resumeDownload(v.id); toast.success("Resuming"); }}>
                <PlayCircle className="w-3.5 h-3.5 mr-2" /> Resume
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => removeOne(v.id)} className="text-primary focus:text-primary">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  };

  return (
    <AppLayout hideFooter>
      <SEO title="My Downloads – BingBloom" description="Watch your downloaded movies offline anytime on BingBloom." />
      <div className="min-h-screen bg-background">
        <div className="max-w-[1180px] mx-auto w-full px-4 pt-3 pb-8">
          <header className="flex items-center justify-between mb-4 pt-1">
            <button onClick={() => navigate(-1)} className="w-8 h-8 grid place-items-center rounded-full hover:bg-foreground/5 text-foreground" aria-label="Back">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-foreground tracking-wide">Downloads</h1>
            <button onClick={() => setShowSearch((s) => !s)} className="w-8 h-8 grid place-items-center rounded-full hover:bg-foreground/5 text-foreground" aria-label="Search">
              <Search className="w-4 h-4" />
            </button>
          </header>

          {showSearch && (
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search downloads…"
              className="w-full mb-3 px-3 py-2 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
            />
          )}

          {/* Sort + category toolbar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {(["all", "movies", "tv", "anime"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition ${
                    category === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground border border-border"
                  }`}
                >
                  {c === "all" ? "All" : c === "tv" ? "Series" : c === "movies" ? "Movies" : "Anime"}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-card border border-border text-muted-foreground hover:text-foreground">
                    <ArrowUpDown className="w-3 h-3" /> Sort
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Sort by</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                    <DropdownMenuRadioItem value="recent">Recently added</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="title">Title (A–Z)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="size">File size</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {empty ? (
            <div className="text-center py-16 text-muted-foreground">
              <CloudDownload className="w-10 h-10 mx-auto mb-3 text-primary" />
              <p className="text-sm font-semibold text-foreground">No downloads yet</p>
              <p className="text-[11px] mt-1">Tap the download button on any movie or episode and it will appear here.</p>
              <Link to="/movies" className="inline-block mt-4 px-4 py-2 rounded-lg text-[12px] font-semibold text-primary-foreground bg-primary">
                Browse movies
              </Link>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
              <div className="min-w-0">
                {folders.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Series</p>
                    <ul className="space-y-2 mb-4">
                      {folders.map((f) => {
                        const isOpen = openFolders[f.key];
                        const readyCount = f.episodes.filter((e) => e.status === "ready").length;
                        return (
                          <li key={f.key} className="rounded-xl overflow-hidden bg-card">
                            <div className="flex items-center gap-3 p-2">
                              <button
                                onClick={() => setOpenFolders((s) => ({ ...s, [f.key]: !s[f.key] }))}
                                className="relative w-[58px] h-[78px] rounded-lg overflow-hidden bg-black flex-shrink-0"
                              >
                                {f.poster ? (
                                  <img src={f.poster} alt={f.title} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full grid place-items-center text-white/30"><Folder className="w-5 h-5" /></div>
                                )}
                              </button>
                              <button
                                onClick={() => setOpenFolders((s) => ({ ...s, [f.key]: !s[f.key] }))}
                                className="flex-1 min-w-0 text-left"
                              >
                                <h3 className="text-xs font-bold text-foreground truncate">{f.title}</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {f.episodes.length} episode{f.episodes.length !== 1 ? "s" : ""} · {readyCount} ready offline
                                </p>
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 text-muted-foreground hover:text-foreground"
                                    aria-label="Series options"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={() => setOpenFolders((s) => ({ ...s, [f.key]: !s[f.key] }))}
                                  >
                                    <ChevronDown className="w-3.5 h-3.5 mr-2" />
                                    {isOpen ? "Collapse" : "Expand"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => removeFolder(f)}
                                    className="text-primary focus:text-primary"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete series
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <ChevronDown
                                onClick={() => setOpenFolders((s) => ({ ...s, [f.key]: !s[f.key] }))}
                                className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${isOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                            {isOpen && (
                              <ul className="space-y-2 px-2 pb-2">
                                {f.episodes.map((e) => renderRow(e, true))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {movies.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Movies</p>
                    <ul className="space-y-2">
                      {movies.map((v) => renderRow(v))}
                    </ul>
                  </>
                )}
              </div>

              {/* Desktop sidebar — quick stats + tips */}
              <aside className="hidden lg:block w-[320px] shrink-0">
                <div className="sticky top-14 space-y-3">
                  <div className="rounded-xl p-4 bg-card border border-border">
                    <h3 className="text-[13px] font-semibold text-foreground mb-1">Library</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {movies.length + folders.reduce((n, f) => n + f.episodes.length, 0)} downloaded items
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {folders.length} series · {movies.length} movies
                    </p>
                  </div>
                  <div className="rounded-xl p-4 bg-card border border-border">
                    <h3 className="text-[13px] font-semibold text-foreground mb-1">Tips</h3>
                    <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4">
                      <li>Downloads play fully offline — great for flights and travel.</li>
                      <li>Pause or resume any active download from the list.</li>
                      <li>Delete an item to reclaim storage instantly.</li>
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* Offline player — matches watch-page shell (player + Up Next sidebar) */}
      {playUrl && playing && (
        <div className="fixed inset-0 z-[100] bg-black/95 overflow-y-auto">
          <div className="max-w-[1180px] mx-auto w-full">
            <div className="sticky top-0 z-10 flex items-center justify-between px-3 h-11 bg-black/95 backdrop-blur border-b border-white/5">
              <h2 className="text-xs font-semibold text-white truncate pr-3">{playing.title}</h2>
              <button onClick={closePlayer} className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10 text-white" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:px-4 lg:pt-3">
              <div className="min-w-0">
                <div className="w-full md:max-w-2xl md:mx-auto lg:max-w-[820px] lg:mx-0">
                  <div className="relative w-full aspect-video bg-black overflow-hidden">
                    <video
                      id="offline-video"
                      src={playUrl}
                      controls
                      autoPlay
                      playsInline
                      crossOrigin={playing.subtitles?.length ? "anonymous" : undefined}
                      onEnded={playNext}
                      className="absolute inset-0 w-full h-full bg-black"
                    >
                      {playing.subtitles?.map((s) => (
                        <track
                          key={s.lang}
                          kind="subtitles"
                          src={subtitleTrackUrls[s.lang]}
                          srcLang={s.lang}
                          label={s.label}
                          default={s.lang === subtitleLang}
                        />
                      ))}
                    </video>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-background border-t border-border/60">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Offline</span>
                    <span className="text-[10px] text-muted-foreground truncate flex-1">{fmtMB(playing.size)}</span>
                    {playing.subtitles && playing.subtitles.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setSubtitleMenuOpen((v) => !v)}
                          title="Subtitles"
                          aria-label="Subtitles"
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[10px] font-semibold text-foreground hover:bg-foreground/10 border border-border/60"
                        >
                          <Subtitles className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Subtitles</span>
                        </button>
                        {subtitleMenuOpen && (
                          <div className="absolute right-0 bottom-full mb-1 z-40 min-w-[160px] rounded-md border border-border/60 bg-background shadow-xl overflow-hidden">
                            <button
                              onClick={() => pickSubtitle("off")}
                              className={`w-full text-left px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white/10 ${subtitleLang === "off" ? "text-primary" : "text-foreground"}`}
                            >Off</button>
                            {playing.subtitles.map((s) => (
                              <button
                                key={s.lang}
                                onClick={() => pickSubtitle(s.lang)}
                                className={`w-full text-left px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white/10 ${subtitleLang === s.lang ? "text-primary" : "text-foreground"}`}
                              >{s.label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={enterFullscreen}
                      title="Fullscreen (F)"
                      aria-label="Fullscreen"
                      className="grid place-items-center h-7 w-7 rounded-md text-foreground hover:bg-foreground/10 border border-border/60"
                    >
                      <Expand className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {playing.recommendations && playing.recommendations.length > 0 && (
                  <section className="mt-4 px-4">
                    <h3 className="text-[12px] font-semibold text-white mb-2">You might also like</h3>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      {playing.recommendations.map((r) => (
                        <Link
                          key={r.tmdbId}
                          to={r.type === "tv" ? `/tv/${r.tmdbId}` : `/movie/${r.tmdbId}`}
                          className="relative flex-shrink-0 w-[100px] aspect-[2/3] rounded-lg overflow-hidden bg-white/5 border border-white/10"
                          onClick={closePlayer}
                        >
                          {r.poster ? (
                            <img src={r.poster} alt={r.title} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-[10px] text-white/50 p-1 text-center">{r.title}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Mobile suggestions strip */}
                {suggestions.length > 0 && (
                  <section className="mt-3 px-4 lg:hidden">
                    <h3 className="text-[12px] font-semibold text-white mb-2">Up Next in your downloads</h3>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      {suggestions.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => playOffline(v)}
                          className="relative flex-shrink-0 w-[110px] aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10"
                        >
                          {v.poster && <img src={v.poster} alt="" loading="lazy" className="w-full h-full object-cover" />}
                          <span className="absolute bottom-1 right-1 grid place-items-center w-5 h-5 rounded-full bg-primary">
                            <Play className="w-2.5 h-2.5 text-white fill-white" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="hidden lg:block w-[320px] shrink-0 pt-1 pb-6">
                <div className="sticky top-14 space-y-3">
                  <h3 className="text-[13px] font-semibold text-white mb-1">Up Next</h3>
                  <div className="space-y-2">
                    {suggestions.length === 0 && (
                      <p className="text-[11px] text-white/50">No other downloads ready yet.</p>
                    )}
                    {suggestions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => playOffline(v)}
                        className="w-full flex gap-2 group text-left"
                      >
                        <div className="relative w-[140px] aspect-video rounded-md overflow-hidden bg-white/5 shrink-0 border border-white/5">
                          {v.poster && (
                            <img src={v.poster} alt="" loading="lazy" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-1 right-1 grid place-items-center w-5 h-5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-2.5 h-2.5 text-white fill-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-primary">
                            {v.title}
                          </p>
                          <p className="text-[10px] text-white/50 mt-1">
                            {v.type === "tv" ? `S${v.season}·E${v.episode}` : "Movie"} · {fmtMB(v.size)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default MyDownloadsPage;
