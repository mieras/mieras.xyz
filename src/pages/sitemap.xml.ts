import type { APIRoute } from "astro";
import { getPublicSitemapPaths } from "../lib/ai-policy";

export const prerender = false;

function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

export const GET: APIRoute = ({ site }) => {
    const origin = site ?? new URL("https://mieras.xyz");
    const lastmod = new Date().toISOString().slice(0, 10);

    const urls = getPublicSitemapPaths()
        .map((path) => {
            const loc = new URL(path, origin).href;
            return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;
        })
        .join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    return new Response(body, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
