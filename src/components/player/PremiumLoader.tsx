import { Loader2, Gauge, Download, Timer } from "lucide-react";

export type LoadStage =
  | "connecting"
  | "securing"
  | "fetching"
  | "metadata"
  | "buffering"
  | "ready";

export const STAGE_LABEL: Record<LoadStage, string> = {
  connecting: "Connecting to server…",
  securing: "Preparing secure stream…",
  fetching: "Fetching video source…",
  metadata: "Loading movie information…",
  buffering: "Initial buffering…",
  ready: "Ready to play…",
};

const ORDER: LoadStage[] = ["connecting", "securing", "fetching", "metadata", "buffering", "ready"];

export function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "0 MB";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 ** 2;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatSpeed(bps: number): string {
  if (!bps || bps <= 0) return "—";
  const mb = bps / 1024 ** 2;
  if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
  return `${Math.max(1, Math.round(bps / 1024))} KB/s`;
}

export function formatClock(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  title?: string;
  year?: string;
  backdrop?: string | null;
  poster?: string | null;
  stage: LoadStage;
  downloadedBytes: number;
  totalBytes: number;
  speedBps: number;
  bufferedSeconds: number;
  targetSeconds: number;
  sourceLabel?: string;
}

/**
 * Premium multi-stage loading overlay. Shows the live pipeline stage plus real
 * download size, speed and buffered duration so the player never feels frozen.
 */
const PremiumLoader = ({
  title,
  year,
  backdrop,
  poster,
  stage,
  downloadedBytes,
  totalBytes,
  speedBps,
  bufferedSeconds,
  targetSeconds,
  sourceLabel,
}: Props) => {
  const bg = backdrop || poster;
  const activeIndex = ORDER.indexOf(stage);
  const bufferPct = targetSeconds > 0 ? Math.min(100, (bufferedSeconds / targetSeconds) * 100) : 0;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 px-5 text-center"
      style={{
        background: bg
          ? `linear-gradient(rgba(6,6,8,0.72), rgba(6,6,8,0.92)), url(${bg}) center/cover no-repeat`
          : "#07070A",
      }}
    >
      <div className="max-w-md">
        {title && (
          <p className="text-white text-base sm:text-xl font-extrabold tracking-tight line-clamp-2">
            {title}
          </p>
        )}
        <p className="text-white/50 text-[11px] mt-1 font-medium">
          {year ? `${year}` : ""}
          {year && sourceLabel ? " · " : ""}
          {sourceLabel || ""}
        </p>
      </div>

      {/* Stage line */}
      <div className="flex items-center gap-2 text-white">
        <Loader2 className="h-4 w-4 animate-spin text-[#E50914]" />
        <span className="text-[13px] font-semibold">{STAGE_LABEL[stage]}</span>
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-1.5">
        {ORDER.map((s, i) => (
          <span
            key={s}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? 22 : 8,
              background:
                i < activeIndex
                  ? "rgba(229,9,20,0.55)"
                  : i === activeIndex
                    ? "#E50914"
                    : "rgba(255,255,255,0.18)",
              boxShadow: i === activeIndex ? "0 0 10px rgba(229,9,20,0.7)" : "none",
            }}
          />
        ))}
      </div>

      {/* Buffer bar toward the 30s pre-buffer target */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#E50914] transition-[width] duration-300"
            style={{ width: `${bufferPct}%` }}
          />
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
        <Stat
          icon={<Download className="h-3.5 w-3.5" />}
          label="Downloaded"
          value={
            totalBytes > 0
              ? `${formatSize(downloadedBytes)} / ${formatSize(totalBytes)}`
              : formatSize(downloadedBytes)
          }
        />
        <Stat icon={<Gauge className="h-3.5 w-3.5" />} label="Speed" value={formatSpeed(speedBps)} />
        <Stat
          icon={<Timer className="h-3.5 w-3.5" />}
          label="Buffered"
          value={formatClock(bufferedSeconds)}
        />
      </div>
    </div>
  );
};

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-xl bg-white/[0.06] border border-white/10 px-2 py-2">
    <div className="flex items-center justify-center gap-1 text-white/45">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-[11.5px] font-bold text-white mt-1 truncate">{value}</p>
  </div>
);

export default PremiumLoader;
