import { getEntry, getCollection } from "astro:content";
import { contentSignalValue } from "./ai-policy";

function stripHtmlToText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function listToMarkdown(items: string[]): string {
    return items.map((item) => `- ${item}`).join("\n");
}

/**
 * Build a clean Markdown representation of the homepage from content collections.
 * No navigation, styles, or animation chrome — intended for AI agents.
 */
export async function buildHomeMarkdown(): Promise<string> {
    const mainEntry = await getEntry("main", "main");
    const seoEntry = await getEntry("seo", "seo");
    const footerEntry = await getEntry("footer", "footer");
    const marqueeEntries = await getCollection("marquee");

    if (!mainEntry || !seoEntry) {
        throw new Error(
            "Missing main or seo content for Markdown representation."
        );
    }

    const {
        title,
        subtitle,
        contact,
        linkedin,
        address,
        clientsTitle,
        clientNames,
        skillsTitle,
        skills,
        subtitleALabel = "About",
        subtitleAText,
        contentAbout,
        services,
    } = mainEntry.data;

    const { person, organization } = seoEntry.data;

    const serviceItems = services
        ? services
              .split(/\n/)
              .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
              .filter(Boolean)
        : skills;

    const marquees = (marqueeEntries[0]?.data ?? [])
        .slice()
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
        .map((m: { text: string; href?: string }) =>
            m.href ? `- [${m.text}](${m.href})` : `- ${m.text}`
        );

    const studioBody = stripHtmlToText(mainEntry.body ?? "");
    const aboutBody = contentAbout
        ? contentAbout.trim()
        : (subtitleAText?.trim() ?? "");

    const addressLines = address
        ? address
              .split(/\n/)
              .map((line) => line.trim())
              .filter(Boolean)
        : [
              organization.address.streetAddress,
              `${organization.address.postalCode} ${organization.address.addressLocality}`,
              organization.address.addressCountry,
          ];

    const parts: string[] = [
        "---",
        `title: ${organization.metaTitle ?? `${title} — ${subtitle}`}`,
        `description: ${organization.metaDescription ?? organization.description}`,
        `canonical: ${organization.url}`,
        `content-signal: ${contentSignalValue}`,
        "---",
        "",
        `# ${title}`,
        "",
        `**${subtitle}**`,
        "",
        organization.description,
        "",
        "## Contact",
        "",
        ...addressLines,
        "",
        `- Email: [${contact}](mailto:${contact})`,
    ];

    if (linkedin) {
        parts.push(`- LinkedIn: ${linkedin}`);
    }

    parts.push(`- Website: ${person.url}`, `- Studio: ${organization.url}`);

    if (footerEntry?.data) {
        const { kvk, btw, bank } = footerEntry.data as {
            kvk?: string;
            btw?: string;
            bank?: string;
        };
        if (kvk) parts.push(`- KVK: ${kvk}`);
        if (btw) parts.push(`- BTW: ${btw}`);
        if (bank) parts.push(`- IBAN: ${bank}`);
    }

    parts.push("", "## Studio", "", studioBody || organization.description);

    if (aboutBody) {
        parts.push("", `## ${subtitleALabel}`, "", aboutBody);
    }

    parts.push("", `## ${clientsTitle}`, "", listToMarkdown(clientNames));
    parts.push("", `## ${skillsTitle}`, "", listToMarkdown(serviceItems));

    if (marquees.length) {
        parts.push("", "## Highlights", "", ...marquees);
    }

    if (organization.sameAs?.length) {
        parts.push(
            "",
            "## Elsewhere",
            "",
            ...organization.sameAs.map((url: string) => `- ${url}`)
        );
    }

    parts.push(
        "",
        "---",
        "",
        `Content usage preferences: ${contentSignalValue}.`,
        "This Markdown representation is served for clients that send `Accept: text/markdown`.",
        ""
    );

    return parts.join("\n");
}
