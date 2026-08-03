import { X } from "lucide-react";

export interface SheetOption {
  key: string;
  label: string;
  sub?: string;
  disabled?: boolean;
}

interface Props {
  title: string;
  options: SheetOption[];
  activeKey: string;
  emptyLabel?: string;
  onPick: (key: string) => void;
  onClose: () => void;
}

/**
 * Modern in-player bottom sheet used for Sources / Quality / Subtitles /
 * Playback speed. Renders inside the player shell so nothing ever leaves the
 * player.
 */
const PlayerSheet = ({ title, options, activeKey, emptyLabel, onPick, onClose }: Props) => (
  <div className="absolute inset-0 z-[60] flex items-end sm:items-center sm:justify-center">
    <button
      aria-label="Close"
      onClick={onClose}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    />
    <div
      className="relative w-full sm:w-[340px] sm:rounded-2xl rounded-t-2xl bg-[#101013]/95 border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
      role="dialog"
      aria-label={title}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/80">{title}</p>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid place-items-center h-7 w-7 rounded-full text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[52vh] overflow-y-auto py-1">
        {options.length === 0 && (
          <p className="px-4 py-6 text-center text-[12px] text-white/50">
            {emptyLabel || "Nothing available"}
          </p>
        )}
        {options.map((opt) => {
          const active = opt.key === activeKey;
          return (
            <button
              key={opt.key}
              disabled={opt.disabled}
              onClick={() => {
                if (!opt.disabled) onPick(opt.key);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                opt.disabled ? "opacity-40" : "hover:bg-white/10 active:bg-white/15"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                  active ? "bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.8)]" : "bg-white/20"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[13.5px] font-semibold truncate ${
                    active ? "text-white" : "text-white/80"
                  }`}
                >
                  {opt.label}
                </span>
                {opt.sub && <span className="block text-[11px] text-white/45 truncate">{opt.sub}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export default PlayerSheet;
