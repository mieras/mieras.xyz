import { getStore } from "@netlify/blobs";

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const STORE_NAME = "feed-cache";

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const memory = new Map<string, CacheEntry<unknown>>();

function isFresh<T>(entry: CacheEntry<T>, ttlMs: number): boolean {
  return Date.now() - entry.ts < ttlMs;
}

function getStoreSafe() {
  try {
    return getStore(STORE_NAME);
  } catch {
    // Local `astro dev` has no Blobs context — memory-only fallback
    return null;
  }
}

/**
 * Cache JSON behind memory (L1) + Netlify Blobs (L2, shared across instances).
 * On fetch failure, returns last-known stale data when available.
 */
export async function cachedJson<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const mem = memory.get(key) as CacheEntry<T> | undefined;
  if (mem && isFresh(mem, ttlMs)) {
    return mem.data;
  }

  let stale: CacheEntry<T> | undefined = mem;

  const store = getStoreSafe();
  if (store) {
    try {
      const blob = (await store.get(key, { type: "json" })) as CacheEntry<T> | null;
      if (blob?.data !== undefined && typeof blob.ts === "number") {
        if (isFresh(blob, ttlMs)) {
          memory.set(key, blob);
          return blob.data;
        }
        stale = blob;
      }
    } catch {
      // ignore blob read errors
    }
  }

  try {
    const data = await fetcher();
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    memory.set(key, entry);

    if (store) {
      try {
        await store.setJSON(key, entry);
      } catch {
        // ignore blob write errors
      }
    }

    return data;
  } catch (err) {
    if (stale) {
      memory.set(key, stale);
      return stale.data;
    }
    throw err;
  }
}
