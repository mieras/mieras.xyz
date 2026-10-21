import { cachedJson } from "./cache";

export interface MixcloudShow {
  id: string;
  title: string;
  cover: string;
  url: string;
  created: string | null;
}

// Public cloudcasts list — no OAuth needed
const USERNAME = () => process.env.MIXCLOUD_USERNAME ?? "mieras";

interface MixcloudApiShow {
  key?: string;
  name?: string;
  url?: string;
  created_time?: string;
  pictures?: Record<string, string>;
}

async function fetchCloudcasts(): Promise<MixcloudShow[]> {
  const username = USERNAME();
  const res = await fetch(
    `https://api.mixcloud.com/${encodeURIComponent(username)}/cloudcasts/?limit=24`
  );

  if (!res.ok) {
    throw new Error(`Mixcloud cloudcasts failed: ${res.status}`);
  }

  const data = (await res.json()) as { data?: MixcloudApiShow[] };

  return (data.data ?? []).map((show) => {
    const pics = show.pictures ?? {};
    const cover =
      pics["640wx640h"] ||
      pics["320wx320h"] ||
      pics.large ||
      pics.extra_large ||
      pics.medium ||
      "";

    return {
      id: show.key ?? show.url ?? show.name ?? "",
      title: show.name ?? "",
      cover,
      url: show.url ?? `https://www.mixcloud.com${show.key ?? ""}`,
      created: show.created_time ?? null,
    };
  });
}

export async function getCloudcasts(): Promise<MixcloudShow[]> {
  try {
    return await cachedJson(`mixcloud:cloudcasts:${USERNAME()}`, fetchCloudcasts);
  } catch (err) {
    console.error("[mixcloud]", err);
    return [];
  }
}
