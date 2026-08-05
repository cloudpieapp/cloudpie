import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import ContentCard from "@/components/ContentCard";
import { useMyList } from "@/hooks/useMyList";
import { useLikedVideos } from "@/hooks/useLikedVideos";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { getAllDownloads, type OfflineVideo } from "@/lib/offlineDownloads";
import { Bookmark, Heart, PlayCircle, Download, ChevronRight } from "lucide-react";

type Tab = "downloads" | "watchlist" | "liked" | "continue";

const tabs: { id: Tab; label: string; icon: typeof Bookmark }[] = [
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "watchlist", label: "Watchlist", icon: Bookmark },
  { id: "liked", label: "Liked", icon: Heart },
  { id: "continue", label: "Continue", icon: PlayCircle },
];

const Empty = ({ icon: Icon, label, hint }: { icon: typeof Bookmark; label: string; hint: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
    <Icon className="w-10 h-10 opacity-60" />
    <p className="text-sm font-medium">{label}</p>
    <p className="text-xs">{hint}</p>
  </div>
);

const LibraryPage = () => {
  const [active, setActive] = useState<Tab>("downloads");
  const saved = useMyList();
  const liked = useLikedVideos();
  const continueWatching = useContinueWatching();
  const [downloads, setDownloads] = useState<OfflineVideo[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAllDownloads()
      .then((d) => { if (!cancelled) setDownloads(d); })
      .catch(() => { if (!cancelled) setDownloads([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLayout>
      <SEO title="Library – BingBloom" description="Your BingBloom library — downloads, watchlist, liked videos and continue watching in one place." />
      <div className="px-4 sm:px-6 pt-4 pb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Library</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Downloads and watchlist in one place</p>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 sticky top-12 sm:top-14 z-20 bg-background/95 backdrop-blur-md">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {tabs.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap min-h-[40px] transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-8 pt-2">
        {active === "downloads" && (
          downloads.length === 0 ? (
            <Empty icon={Download} label="No downloads yet" hint="Tap Download on any movie or episode to save it offline" />
          ) : (
            <div className="space-y-2">
              {downloads.map((d) => (
                <Link
                  key={d.id}
                  to="/my-downloads"
                  className="flex items-center gap-3 rounded-xl bg-card border border-border p-2"
                >
                  <div className="w-14 aspect-[2/3] rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {d.poster && <img src={d.poster} alt={d.title} loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{d.status || "saved"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
              <Link to="/my-downloads" className="block text-center text-xs font-semibold text-primary pt-2">
                Open downloads manager
              </Link>
            </div>
          )
        )}

        {active === "watchlist" && (
          saved.length === 0 ? (
            <Empty icon={Bookmark} label="Your watchlist is empty" hint="Tap Add to Watchlist on any movie to save it" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {saved.map((v) => <ContentCard key={v.id} video={v} />)}
            </div>
          )
        )}

        {active === "liked" && (
          liked.length === 0 ? (
            <Empty icon={Heart} label="No liked videos yet" hint="Like videos to see them here" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {liked.map((v) => <ContentCard key={v.id} video={v} />)}
            </div>
          )
        )}

        {active === "continue" && (
          continueWatching.length === 0 ? (
            <Empty icon={PlayCircle} label="Nothing in progress" hint="Start watching to see content here" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {continueWatching.map((e) => (
                <div key={e.video.id} className="relative">
                  <ContentCard video={e.video} />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 rounded-b">
                    <div className="h-full bg-primary rounded-b" style={{ width: `${e.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
};

export default LibraryPage;
