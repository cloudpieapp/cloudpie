// Lightweight resume-position store shared by online + offline players.
// Keyed per playable id so movies, TV episodes, and downloads each track their
// own resume point. Persists to localStorage so the app can pick up after a
// reload, a device restart, or a switch to offline.

const KEY = "bb:resume:v1";

type Entry = { t: number; d?: number; at: number };
type Store = Record<string, Entry>;

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function write(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota — ignore */
  }
}

/** Stable id builder — safe to call with partial args. */
export function resumeIdFor(args: {
  type: "movie" | "tv" | "anime" | "download";
  tmdbId?: string | number;
  season?: number;
  episode?: number;
  downloadId?: string;
}): string {
  if (args.type === "download" && args.downloadId) return `dl:${args.downloadId}`;
  const base = `${args.type}:${args.tmdbId ?? ""}`;
  if (args.type === "tv" && args.season != null && args.episode != null) {
    return `${base}:s${args.season}e${args.episode}`;
  }
  return base;
}

export function getResume(id: string): number {
  if (!id) return 0;
  return read()[id]?.t || 0;
}

/** Save the current position. Ignores tiny (<15s) and near-end (>95%) values. */
export function setResume(id: string, t: number, d?: number) {
  if (!id || !Number.isFinite(t)) return;
  const s = read();
  if (d && d > 0 && t >= d * 0.95) {
    delete s[id];
  } else if (t < 15) {
    return;
  } else {
    s[id] = { t: Math.floor(t), d: d ? Math.floor(d) : undefined, at: Date.now() };
  }
  write(s);
}

export function clearResume(id: string) {
  if (!id) return;
  const s = read();
  if (id in s) {
    delete s[id];
    write(s);
  }
}