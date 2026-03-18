export interface SpotifyTrack {
  id: string;
  artist: string;
  title: string;
  albumArt: string;
  trackUrl: string;
}

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Spotify token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function getRecentlyPlayed(limit = 10): Promise<SpotifyTrack[]> {
  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn("[spotify] Missing env vars — skipping Spotify marquee.");
    return [];
  }

  try {
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);

    const res = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      throw new Error(`Spotify recently-played failed: ${res.status}`);
    }

    const data = await res.json();
    const seen = new Set<string>();
    const tracks: SpotifyTrack[] = [];

    for (const item of data.items ?? []) {
      const track = item.track;
      if (!track || seen.has(track.id)) continue;
      seen.add(track.id);

      const albumArt =
        track.album?.images?.find((img: { width: number }) => img.width >= 64)?.url ??
        track.album?.images?.[track.album.images.length - 1]?.url ??
        "";

      tracks.push({
        id: track.id,
        artist: track.artists?.map((a: { name: string }) => a.name).join(", ") ?? "",
        title: track.name ?? "",
        albumArt,
        trackUrl: track.external_urls?.spotify ?? "",
      });
    }

    return tracks;
  } catch (err) {
    console.warn("[spotify] Failed to fetch recently played:", err);
    return [];
  }
}
