/**
 * Central AI readiness policy for mieras.xyz.
 *
 * Policy: allow search indexing and AI answers / grounding (ai-input),
 * but disallow model training / fine-tuning (ai-train).
 *
 * robots.txt and Content Signals express preferences only — they are not
 * technical enforcement. Use a WAF / bot product if you need hard blocks.
 */

export type ContentSignals = {
    search: "yes" | "no";
    "ai-input": "yes" | "no";
    "ai-train": "yes" | "no";
};

export const contentSignals: ContentSignals = {
    search: "yes",
    "ai-input": "yes",
    "ai-train": "no",
};

/** Machine-readable Content-Signal value for robots.txt and HTTP headers. */
export const contentSignalValue = Object.entries(contentSignals)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");

/**
 * Search / citation bots and user-initiated fetchers — allow.
 * These help the site show up in AI answers without being pure training crawlers.
 */
export const allowedAiAgents = [
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
] as const;

/**
 * Training-focused crawlers and training opt-out tokens — disallow.
 *
 * Note: Google-Extended and Applebot-Extended are control tokens, not always
 * separate HTTP user-agents. Disallowing them opts content out of Gemini /
 * Apple Intelligence training (and related grounding where those tokens apply).
 */
export const disallowedTrainingAgents = [
    "GPTBot",
    "ClaudeBot",
    "anthropic-ai",
    "Google-Extended",
    "Applebot-Extended",
    "CCBot",
    "Bytespider",
    "cohere-ai",
    "cohere-training-data-crawler",
    "meta-externalagent",
    "Diffbot",
    "ImagesiftBot",
] as const;

/**
 * Mixed-purpose crawlers (search + possible training under one UA).
 * Left under the wildcard Allow — do not blanket-Disallow Googlebot / Bingbot /
 * Applebot or you lose classical search visibility.
 */
export const mixedPurposeAgents = ["Googlebot", "Bingbot", "Applebot"] as const;

/** Human-readable Content Signals Policy preamble (comments in robots.txt). */
export const contentSignalsPolicyComments = `# As a condition of accessing this website, you agree to abide by the following
# content signals:
#
# (a)  If a content-signal = yes, you may collect content for the corresponding use.
# (b)  If a content-signal = no, you may not collect content for the corresponding use.
# (c)  If the website operator does not include a content signal for a corresponding
#      use, the website operator neither grants nor restricts permission via content
#      signal with respect to the corresponding use.
#
# The content signals and their meanings are:
# search: building a search index and providing search results (e.g., returning
#         hyperlinks and short excerpts from your website's contents). Search does
#         not include providing AI-generated search summaries.
# ai-input: inputting content into one or more AI models (e.g., retrieval augmented
#           generation, grounding, or other real-time taking of content for
#           generative AI search answers).
# ai-train: training or fine-tuning AI models.
#
# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS RESERVATIONS OF
# RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN UNION DIRECTIVE 2019/790 ON COPYRIGHT
# AND RELATED RIGHTS IN THE DIGITAL SINGLE MARKET.`;

/** Build a complete robots.txt body for the given site origin. */
export function buildRobotsTxt(site: URL | string): string {
    const origin = typeof site === "string" ? site : site.origin;
    const sitemapUrl = new URL("/sitemap.xml", origin).href;

    const lines: string[] = [
        contentSignalsPolicyComments,
        "",
        "User-agent: *",
        `Content-Signal: ${contentSignalValue}`,
        "Allow: /",
        "",
        "# Allowed: search / citation bots and user-initiated AI fetchers",
    ];

    for (const agent of allowedAiAgents) {
        lines.push(`User-agent: ${agent}`, "Allow: /", "");
    }

    lines.push("# Disallowed: training crawlers and training opt-out tokens");
    for (const agent of disallowedTrainingAgents) {
        lines.push(`User-agent: ${agent}`, "Disallow: /", "");
    }

    lines.push(
        "# Mixed-purpose crawlers (Googlebot, Bingbot, Applebot) stay under",
        "# User-agent: * — do not Disallow them if you want classical search.",
        "",
        `Sitemap: ${sitemapUrl}`,
        ""
    );

    return lines.join("\n");
}

/** Public URLs that should appear in the sitemap (absolute). */
export function getPublicSitemapPaths(): string[] {
    return ["/"];
}
