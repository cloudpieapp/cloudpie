// IndexedDB-backed offline video store.
// Stores MP4 blobs in chunks for resumable download + offline playback.

const DB_NAME = "bingbloom-offline";
const DB_VERSION = 1;
const STORE_META = "videos";     // metadata + completed blob
const STORE_CHUNKS = "chunks";   // per-video temp chunks during download

export interface OfflineVideo {
  id: string;                  // `${type}-${tmdbId}` (or per-episode for tv)
  type: "movie" | "tv" | "anime";
  tmdbId: string;
  title: string;               // per-episode title shown in UI
  seriesTitle?: string;        // folder name for grouped series episodes
  season?: number;
  episode?: number;
  poster?: string | null;
  backdrop?: string | null;
  sourceUrl: string;
  mime: string;
  size: number;                // total bytes
  downloaded: number;          // bytes downloaded so far
  status: "queued" | "downloading" | "paused" | "ready" | "error";
  error?: string;
  blob?: Blob;                 // present once status==="ready"
  /** Inline WebVTT subtitle tracks captured at download time. */
  subtitles?: OfflineSubtitle[];
  /** Cached "you might also like" snapshot (TMDB similar) for offline playback. */
  recommendations?: OfflineRecommendation[];
  createdAt: number;
  updatedAt: number;
}

export interface OfflineSubtitle {
  lang: string;
  label: string;
  vtt: string; // full WebVTT text
}

export interface OfflineRecommendation {
  tmdbId: string;
  type: "movie" | "tv" | "anime";
  title: string;
  poster?: string | null;
}

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MiB

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
        db.createObjectStore(STORE_CHUNKS, { keyPath: ["videoId", "index"] });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const r = run(t.objectStore(storeName));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      }),
  );
}

export async function getAllDownloads(): Promise<OfflineVideo[]> {
  const list = await tx<OfflineVideo[]>(STORE_META, "readonly", (s) =>
    s.getAll() as IDBRequest<OfflineVideo[]>,
  );
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getDownload(id: string): Promise<OfflineVideo | undefined> {
  return tx<OfflineVideo | undefined>(STORE_META, "readonly", (s) =>
    s.get(id) as IDBRequest<OfflineVideo | undefined>,
  );
}

export async function isDownloaded(id: string): Promise<boolean> {
  const v = await getDownload(id);
  return !!v && v.status === "ready" && !!v.blob;
}

export async function getDownloadBlobUrl(id: string): Promise<string | null> {
  const v = await getDownload(id);
  if (!v || v.status !== "ready" || !v.blob) return null;
  return URL.createObjectURL(v.blob);
}

async function putMeta(meta: OfflineVideo): Promise<void> {
  await tx(STORE_META, "readwrite", (s) => s.put(meta));
}

export async function deleteDownload(id: string): Promise<void> {
  await tx(STORE_META, "readwrite", (s) => s.delete(id));
  // remove chunks
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE_CHUNKS, "readwrite");
    const store = t.objectStore(STORE_CHUNKS);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) {
        const k = cur.key as [string, number];
        if (k[0] === id) cur.delete();
        cur.continue();
      }
    };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function estimateStorage(): Promise<{
  quota: number;
  usage: number;
  free: number;
  pctUsed: number;
}> {
  if (!("storage" in navigator) || !navigator.storage.estimate) {
    return { quota: 0, usage: 0, free: 0, pctUsed: 0 };
  }
  const est = await navigator.storage.estimate();
  const quota = est.quota || 0;
  const usage = est.usage || 0;
  return {
    quota,
    usage,
    free: Math.max(0, quota - usage),
    pctUsed: quota > 0 ? (usage / quota) * 100 : 0,
  };
}

type ProgressFn = (meta: OfflineVideo) => void;

const activeControllers = new Map<string, AbortController>();
const pauseFlags = new Map<string, boolean>();

export function pauseDownload(id: string) {
  pauseFlags.set(id, true);
  activeControllers.get(id)?.abort();
}

export function isPaused(id: string) {
  return pauseFlags.get(id) === true;
}

/** Resume a paused download. Re-invokes startDownload with the stored args. */
export async function resumeDownload(id: string): Promise<OfflineVideo | null> {
  const meta = await getDownload(id);
  if (!meta) return null;
  if (meta.status === "ready") return meta;
  return startDownload({
    id: meta.id,
    type: meta.type,
    tmdbId: meta.tmdbId,
    title: meta.title,
    seriesTitle: meta.seriesTitle,
    season: meta.season,
    episode: meta.episode,
    poster: meta.poster,
    backdrop: meta.backdrop,
    sourceUrl: meta.sourceUrl,
    mime: meta.mime,
  });
}

interface StartArgs {
  id: string;
  type: OfflineVideo["type"];
  tmdbId: string;
  title: string;
  seriesTitle?: string;
  season?: number;
  episode?: number;
  poster?: string | null;
  backdrop?: string | null;
  sourceUrl: string;
  mime?: string;
  subtitles?: OfflineSubtitle[];
  recommendations?: OfflineRecommendation[];
  onProgress?: ProgressFn;
}

/**
 * Start (or resume) a download. Streams the MP4 in CHUNK_SIZE byte ranges
 * so it can be paused/resumed and progress reported.
 */
export async function startDownload(args: StartArgs): Promise<OfflineVideo> {
  const { id, sourceUrl, onProgress } = args;
  pauseFlags.set(id, false);

  // Load or init meta
  let meta = await getDownload(id);
  if (!meta) {
    meta = {
      id,
      type: args.type,
      tmdbId: args.tmdbId,
      title: args.title,
      seriesTitle: args.seriesTitle,
      season: args.season,
      episode: args.episode,
      poster: args.poster ?? null,
      backdrop: args.backdrop ?? null,
      sourceUrl,
      mime: args.mime || "video/mp4",
      size: 0,
      downloaded: 0,
      status: "queued",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await putMeta(meta);
  } else if (meta.status === "ready") {
    return meta;
  }

  // Merge in any newly-supplied subtitles/recommendations (e.g. resume with
  // richer metadata than the original queued entry had).
  if (args.subtitles?.length) meta.subtitles = args.subtitles;
  if (args.recommendations?.length) meta.recommendations = args.recommendations;

  // Storage guard
  const { free } = await estimateStorage();

  // Probe total size with HEAD or Range 0-0
  try {
    const probe = await fetch(sourceUrl, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
    });
    const contentRange = probe.headers.get("Content-Range");
    if (contentRange) {
      const total = Number(contentRange.split("/")[1] || 0);
      meta.size = total || meta.size;
    } else {
      const cl = Number(probe.headers.get("Content-Length") || 0);
      meta.size = cl || meta.size;
    }
    const ct = probe.headers.get("Content-Type");
    if (ct) meta.mime = ct;
  } catch {
    // ignore – we'll still try a full GET below
  }

  if (free > 0 && meta.size > 0 && meta.size > free) {
    meta.status = "error";
    meta.error = "Not enough storage available";
    meta.updatedAt = Date.now();
    await putMeta(meta);
    onProgress?.(meta);
    return meta;
  }

  meta.status = "downloading";
  meta.updatedAt = Date.now();
  await putMeta(meta);
  onProgress?.(meta);

  // Determine where to resume
  let nextIndex = Math.floor(meta.downloaded / CHUNK_SIZE);

  const ctrl = new AbortController();
  activeControllers.set(id, ctrl);

  try {
    while (true) {
      if (pauseFlags.get(id)) break;
      const start = nextIndex * CHUNK_SIZE;
      if (meta.size > 0 && start >= meta.size) break;
      const end = meta.size > 0 ? Math.min(start + CHUNK_SIZE - 1, meta.size - 1) : start + CHUNK_SIZE - 1;
      const res = await fetch(sourceUrl, {
        headers: { Range: `bytes=${start}-${end}` },
        signal: ctrl.signal,
      });
      if (!res.ok && res.status !== 206 && res.status !== 200) {
        throw new Error(`HTTP ${res.status}`);
      }
      const buf = await res.arrayBuffer();
      const got = buf.byteLength;
      if (got === 0) break;

      // store chunk
      await tx(STORE_CHUNKS, "readwrite", (s) =>
        s.put({ videoId: id, index: nextIndex, blob: new Blob([buf], { type: meta!.mime }) }),
      );

      meta.downloaded = start + got;
      meta.updatedAt = Date.now();
      if (meta.size === 0 && got < CHUNK_SIZE) {
        meta.size = meta.downloaded;
      }
      await putMeta(meta);
      onProgress?.(meta);

      nextIndex++;
      if (meta.size > 0 && meta.downloaded >= meta.size) break;
      if (got < CHUNK_SIZE) break;
    }

    if (pauseFlags.get(id)) {
      meta.status = "paused";
      meta.updatedAt = Date.now();
      await putMeta(meta);
      onProgress?.(meta);
      return meta;
    }

    // Concatenate chunks into final blob
    const allChunks: { index: number; blob: Blob }[] = await new Promise(
      (resolve, reject) => {
        openDb().then((db) => {
          const t = db.transaction(STORE_CHUNKS, "readonly");
          const store = t.objectStore(STORE_CHUNKS);
          const out: { index: number; blob: Blob }[] = [];
          const req = store.openCursor();
          req.onsuccess = () => {
            const cur = req.result;
            if (cur) {
              const k = cur.key as [string, number];
              if (k[0] === id) {
                const val = cur.value as { index: number; blob: Blob };
                out.push({ index: val.index, blob: val.blob });
              }
              cur.continue();
            } else {
              resolve(out.sort((a, b) => a.index - b.index));
            }
          };
          req.onerror = () => reject(req.error);
        });
      },
    );
    const finalBlob = new Blob(
      allChunks.map((c) => c.blob),
      { type: meta.mime },
    );
    meta.blob = finalBlob;
    meta.size = finalBlob.size;
    meta.downloaded = finalBlob.size;
    meta.status = "ready";
    meta.updatedAt = Date.now();
    await putMeta(meta);

    // Cleanup chunks
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const t = db.transaction(STORE_CHUNKS, "readwrite");
      const store = t.objectStore(STORE_CHUNKS);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) {
          const k = cur.key as [string, number];
          if (k[0] === id) cur.delete();
          cur.continue();
        }
      };
      t.oncomplete = () => resolve();
    });

    onProgress?.(meta);
    return meta;
  } catch (e: unknown) {
    if ((e as Error).name === "AbortError" || pauseFlags.get(id)) {
      meta.status = "paused";
    } else {
      meta.status = "error";
      meta.error = (e as Error).message || "Download failed";
    }
    meta.updatedAt = Date.now();
    await putMeta(meta);
    onProgress?.(meta);
    return meta;
  } finally {
    activeControllers.delete(id);
  }
}

/* ------------------------------------------------------------------ *
 * Human readable sizes + progressive (watch-while-downloading) support
 * ------------------------------------------------------------------ */

/** Formats bytes as KB / MB / GB. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const gb = 1024 ** 3;
  const mb = 1024 ** 2;
  const kb = 1024;
  if (bytes >= gb) return `${(bytes / gb).toFixed(bytes / gb >= 10 ? 1 : 2)} GB`;
  if (bytes >= mb) return `${Math.round(bytes / mb)} MB`;
  return `${Math.max(1, Math.round(bytes / kb))} KB`;
}

/** Minimum bytes required before partial playback is offered. */
export const MIN_PARTIAL_BYTES = 6 * 1024 * 1024;

/**
 * Concatenates the contiguous, already-downloaded chunks of a video (stopping
 * at the first gap) into a single blob. Used for progressive playback while a
 * download is still running — the player and downloader share the same data,
 * nothing is re-fetched.
 */
export async function getContiguousData(
  id: string,
): Promise<{ blob: Blob; bytes: number } | null> {
  const meta = await getDownload(id);
  if (!meta) return null;
  if (meta.status === "ready" && meta.blob) {
    return { blob: meta.blob, bytes: meta.blob.size };
  }
  const db = await openDb();
  const chunks: { index: number; blob: Blob }[] = await new Promise((resolve, reject) => {
    const t = db.transaction(STORE_CHUNKS, "readonly");
    const store = t.objectStore(STORE_CHUNKS);
    const out: { index: number; blob: Blob }[] = [];
    const req = store.openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) {
        const k = cur.key as [string, number];
        if (k[0] === id) {
          const val = cur.value as { index: number; blob: Blob };
          out.push({ index: val.index, blob: val.blob });
        }
        cur.continue();
      } else {
        resolve(out.sort((a, b) => a.index - b.index));
      }
    };
    req.onerror = () => reject(req.error);
  });
  if (!chunks.length) return null;
  // Stop at the first missing index so we never claim more data than exists.
  const contiguous: Blob[] = [];
  let expected = 0;
  let bytes = 0;
  for (const c of chunks) {
    if (c.index !== expected) break;
    contiguous.push(c.blob);
    bytes += c.blob.size;
    expected++;
  }
  if (!contiguous.length) return null;
  return { blob: new Blob(contiguous, { type: meta.mime || "video/mp4" }), bytes };
}

/**
 * Returns an object URL for whatever is currently playable — the finished file
 * when the download completed, otherwise the contiguous downloaded prefix.
 */
export async function getPlayableSource(
  id: string,
): Promise<{ url: string; bytes: number; total: number; partial: boolean } | null> {
  const meta = await getDownload(id);
  if (!meta) return null;
  const data = await getContiguousData(id);
  if (!data) return null;
  const partial = !(meta.status === "ready" && meta.blob);
  if (partial && data.bytes < MIN_PARTIAL_BYTES) return null;
  return {
    url: URL.createObjectURL(data.blob),
    bytes: data.bytes,
    total: meta.size || data.bytes,
    partial,
  };
}

/** How many contiguous bytes are playable right now. */
export async function getPlayableBytes(id: string): Promise<number> {
  const data = await getContiguousData(id);
  return data?.bytes ?? 0;
}
