import { cachedJson } from "./cache";

export interface WatchedItem {
  id: string;
  title: string;
  year: number | null;
  type: "movie" | "show";
  poster: string;
  url: string;
  watchedAt: string | null;
}

const TRAKT_HEADERS = (clientId: string) => ({
  "Content-Type": "application/json",
  "trakt-api-version": "2",
  "trakt-api-key": clientId,
  "User-Agent": "mieras.xyz/1.0",
});

interface TraktIds {
  trakt?: number;
  slug?: string;
  tmdb?: number;
  imdb?: string;
}

interface TraktHistoryEntry {
  id: number;
  watched_at?: string;
  type?: string;
  movie?: { title?: string; year?: number; ids?: TraktIds };
  show?: { title?: string; year?: number; ids?: TraktIds };
  episode?: { season?: number; number?: number; title?: string };
}

async function tmdbPoster(
  apiKey: string,
  type: "movie" | "tv",
  tmdbId: number
): Promise<string> {
  const res = await fetch(
    `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${encodeURIComponent(apiKey)}`
  );
  if (!res.ok) return "";
  const data = (await res.json()) as { poster_path?: string | null };
  return data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "";
}

async function fetchHistory(): Promise<WatchedItem[]> {
  const username = process.env.TRAKT_USERNAME;
  const clientId = process.env.TRAKT_CLIENT_ID;
  const tmdbKey = process.env.TMDB_API_KEY;

  if (!username || !clientId) {
    console.warn("[trakt] Missing TRAKT_USERNAME or TRAKT_CLIENT_ID — skipping watch feed.");
    return [];
  }

  const res = await fetch(
    `https://api.trakt.tv/users/${encodeURIComponent(username)}/history?limit=24`,
    { headers: TRAKT_HEADERS(clientId) }
  );

  if (!res.ok) {
    throw new Error(`Trakt history failed: ${res.status}`);
  }

  const entries = (await res.json()) as TraktHistoryEntry[];
  const draft: Array<WatchedItem & { tmdbId?: number }> = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const isMovie = Boolean(entry.movie) || entry.type === "movie";
    const media = isMovie ? entry.movie : entry.show;
    if (!media?.title) continue;

    const type: "movie" | "show" = isMovie ? "movie" : "show";
    const slug = media.ids?.slug;
    const traktId = media.ids?.trakt;
    const dedupeKey = `${type}:${traktId ?? slug ?? media.title}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const path =
      type === "movie" ? `movies/${slug ?? traktId}` : `shows/${slug ?? traktId}`;

    draft.push({
      id: String(traktId ?? slug ?? media.title),
      title: media.title,
      year: media.year ?? null,
      type,
      poster: "",
      url: `https://trakt.tv/${path}`,
      watchedAt: entry.watched_at ?? null,
      tmdbId: media.ids?.tmdb,
    });
  }

  if (tmdbKey) {
    await Promise.all(
      draft.map(async (item) => {
        if (!item.tmdbId) return;
        try {
          item.poster = await tmdbPoster(
            tmdbKey,
            item.type === "movie" ? "movie" : "tv",
            item.tmdbId
          );
        } catch {
          item.poster = "";
        }
      })
    );
  }

  return draft.map(({ tmdbId: _tmdbId, ...item }) => item);
}

export async function getRecentlyWatched(): Promise<WatchedItem[]> {
  const username = process.env.TRAKT_USERNAME ?? "anon";
  try {
    // v2: bust caches written before TMDB posters were available
    return await cachedJson(`trakt:history:v2:${username}`, fetchHistory);
  } catch (err) {
    console.error("[trakt]", err);
    return [];
  }
}
