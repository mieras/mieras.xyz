import { cachedJson } from "./cache";

export interface GoodreadsBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  url: string;
  rating: number;
  published: string;
  dateAdded: string | null;
  dateRead: string | null;
}

// Public shelf — override via env if it ever changes
const USER_ID = () => process.env.GOODREADS_USER_ID ?? "61686650";
const SHELF = () => process.env.GOODREADS_SHELF ?? "mieras-xyz";

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decode(value: string): string {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .trim();
}

function field(item: string, tag: string): string {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decode(match[1].trim()) : "";
}

function parseDateIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Goodreads serves thumbnails like `12345._SY75_.jpg`; dropping the size
// suffix returns the full-size cover. "nophoto" placeholders are skipped.
function coverUrl(item: string): string {
  const raw = field(item, "book_large_image_url") || field(item, "book_image_url");
  if (!raw || raw.includes("nophoto")) return "";
  return raw.replace(/\._S[XY]\d+_(?=\.\w+$)/, "");
}

async function fetchShelfBooks(): Promise<GoodreadsBook[]> {
  const res = await fetch(
    `https://www.goodreads.com/review/list_rss/${USER_ID()}?shelf=${encodeURIComponent(SHELF())}`
  );

  if (!res.ok) {
    throw new Error(`Goodreads RSS failed: ${res.status}`);
  }

  const xml = await res.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  const books: GoodreadsBook[] = items.map((item) => {
    const id = field(item, "book_id");
    return {
      id,
      title: field(item, "title"),
      author: field(item, "author_name"),
      cover: coverUrl(item),
      url: id ? `https://www.goodreads.com/book/show/${id}` : field(item, "link"),
      rating: Number(field(item, "user_rating")) || 0,
      published: field(item, "book_published"),
      dateAdded: parseDateIso(field(item, "user_date_added")),
      dateRead: parseDateIso(field(item, "user_read_at")),
    };
  });

  books.sort(
    (a, b) =>
      (b.dateAdded ? Date.parse(b.dateAdded) : 0) - (a.dateAdded ? Date.parse(a.dateAdded) : 0)
  );

  return books;
}

export async function getShelfBooks(): Promise<GoodreadsBook[]> {
  try {
    return await cachedJson(`goodreads:${USER_ID()}:${SHELF()}`, fetchShelfBooks);
  } catch (err) {
    console.error("[goodreads]", err);
    return [];
  }
}
