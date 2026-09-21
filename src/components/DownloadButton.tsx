import { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";
import { getDownload } from "@/lib/offlineDownloads";
import DownloadSourceSheet from "./DownloadSourceSheet";

interface Props {
  type: "movie" | "tv" | "anime";
  tmdbId: string;
  title: string;
  year?: string;
  season?: number;
  episode?: number;
  id?: string;
  poster?: string | null;
  backdrop?: string | null;
  size?: "sm" | "md" | "icon";
}

const DownloadButton = ({ type, tmdbId, title, year, season, episode, poster, backdrop, size = "md" }: Props) => {
  const itemId = `${type}-${tmdbId}${season ? `-s${season}-e${episode ?? 1}` : ""}`;
  const [sourceOpen, setSourceOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // Poll the offline store so the button shows a tick once the title is
  // queued / downloading / downloaded (replaces the old toast).
  useEffect(() => {
    let active = true;
    const check = async () => {
      const d = await getDownload(itemId);
      if (active) setSaved(Boolean(d));
    };
    void check();
    const iv = window.setInterval(check, 2000);
    return () => {
      active = false;
      window.clearInterval(iv);
    };
  }, [itemId]);

  const sheet = (
    <DownloadSourceSheet
      open={sourceOpen}
      onOpenChange={setSourceOpen}
      type={type}
      tmdbId={tmdbId}
      title={title}
      year={year}
      season={season}
      episode={episode}
      itemId={itemId}
      poster={poster}
      backdrop={backdrop}
    />
  );

  if (size === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSourceOpen(true); }}
          className="w-6 h-6 grid place-items-center rounded-full bg-black/70 hover:bg-[#7517FF] transition-colors"
          aria-label="Download episode"
        >
          {saved ? (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          ) : (
            <Download className="w-3 h-3 text-white" strokeWidth={2.5} />
          )}
        </button>
        {sheet}
      </>
    );
  }

  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <>
      <button
        onClick={() => setSourceOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg font-semibold text-white transition-all hover:scale-[1.02] ${padding}`}
        style={{ background: "#7517FF" }}
      >
        {saved ? <Check className={icon} strokeWidth={3} /> : <Download className={icon} />}
        {saved ? "Downloaded" : "Download"}
      </button>
      {sheet}
    </>
  );
};

export default DownloadButton;
