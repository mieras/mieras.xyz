import { cachedJson } from "./cache";

export interface DiscogsRelease {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  year: number | null;
  added: string | null;
}

const USERNAME = () => process.env.DISCOGS_USERNAME ?? "mieras";

interface DiscogsApiRelease {
  id?: number;
  date_added?: string;
  basic_information?: {
    id?: number;
    title?: string;
    year?: number;
    cover_image?: string;
    thumb?: string;
    artists?: Array<{ name?: string }>;
    resource_url?: string;
  };
}

async function fetchCollection(): Promise<DiscogsRelease[]> {
  const token = process.env.DISCOGS_TOKEN;
  if (!token) {
    console.warn("[discogs] Missing DISCOGS_TOKEN — skipping collection.");
    return [];
  }

  const username = USERNAME();
  const res = await fetch(
    `https://api.discogs.com/users/${encodeURIComponent(username)}/collection/folders/0/releases?sort=added&sort_order=desc&per_page=24`,
    {
      headers: {
        Authorization: `Discogs token=${token}`,
        "User-Agent": "mieras.xyz/1.0 +https://mieras.xyz",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Discogs collection failed: ${res.status}`);
  }

  const data = (await res.json()) as { releases?: DiscogsApiRelease[] };

  return (data.releases ?? []).map((release) => {
    const info = release.basic_information ?? {};
    const id = String(info.id ?? release.id ?? "");
    const artist =
      info.artists
        ?.map((a) => a.name)
        .filter(Boolean)
        .join(", ") ?? "";

    return {
      id,
      title: info.title ?? "",
      artist,
      cover: info.cover_image || info.thumb || "",
      url: id ? `https://www.discogs.com/release/${id}` : "https://www.discogs.com/",
      year: info.year ?? null,
      added: release.date_added ?? null,
    };
  });
}

export async function getRecentAdditions(): Promise<DiscogsRelease[]> {
  try {
    return await cachedJson(`discogs:collection:${USERNAME()}`, fetchCollection);
  } catch (err) {
    console.error("[discogs]", err);
    return [];
  }
}
