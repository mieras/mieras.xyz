import type { APIRoute } from "astro";
import { getEntry } from "astro:content";

export const prerender = false;

/**
 * /llms.txt — index for AI assistants (llmstxt.org).
 * Keep in sync with getPublicSitemapPaths() when adding public routes.
 */
export const GET: APIRoute = async ({ site }) => {
    const origin = site ?? new URL("https://mieras.xyz");
    const seo = await getEntry("seo", "seo");
    const feed = await getEntry("feed", "feed");

    const person = seo!.data.person;
    const org = seo!.data.organization;
    const addr = org.address;
    const location = [
        addr.streetAddress,
        `${addr.postalCode} ${addr.addressLocality}`,
    ].join(", ");
    const linkedIn = "https://linkedin.com/in/mieras";

    const pages: { title: string; path: string; description?: string }[] = [
        {
            title: `${person.name} — ${person.jobTitle}`,
            path: "/",
            description: org.metaDescription ?? org.description,
        },
        {
            title: feed?.data.title ?? "Feed",
            path: "/feed",
            description: feed?.data.subtitle,
        },
    ];

    const link = (item: (typeof pages)[number]) => {
        const href = new URL(item.path, origin).href;
        const desc = item.description?.replace(/\s+/g, " ").trim();
        return `- [${item.title}](${href})${desc ? `: ${desc}` : ""}`;
    };

    const body = [
        `# ${org.name}`,
        "",
        `> ${person.name}, ${person.jobTitle} — Rotterdam`,
        "",
        org.description,
        "",
        "Also co-owns [All This](https://allthis.digital), a design studio based in Rotterdam.",
        "",
        "Focus: UX, product design, and visual craft — clear, intuitive digital products.",
        "",
        `Location: ${location}`,
        `Contact: ${org.email}`,
        `LinkedIn: ${linkedIn}`,
        "",
        "## Pages",
        "",
        ...pages.map(link),
        "",
    ].join("\n");

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
