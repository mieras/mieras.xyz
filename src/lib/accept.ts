/**
 * Parse Accept header preferences for text/markdown content negotiation.
 * Follows q-value and specificity rules — do not substring-match alone.
 */

type AcceptEntry = {
    type: string;
    subtype: string;
    q: number;
    specificity: number;
};

function parseAccept(header: string | null): AcceptEntry[] {
    if (!header || !header.trim()) return [];

    return header
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const [media, ...params] = part.split(";").map((s) => s.trim());
            const [type = "*", subtype = "*"] = media.toLowerCase().split("/");
            let q = 1;
            for (const param of params) {
                const [key, raw] = param.split("=").map((s) => s.trim());
                if (key === "q" && raw !== undefined) {
                    const parsed = Number.parseFloat(raw);
                    if (!Number.isNaN(parsed)) q = parsed;
                }
            }
            const specificity = type === "*" ? 0 : subtype === "*" ? 1 : 2;
            return { type, subtype, q, specificity };
        })
        .filter((entry) => entry.q >= 0);
}

function matches(entry: AcceptEntry, type: string, subtype: string): boolean {
    if (entry.type === "*" && entry.subtype === "*") return true;
    if (entry.type === type && entry.subtype === "*") return true;
    return entry.type === type && entry.subtype === subtype;
}

/**
 * Whether the client prefers text/markdown over text/html (or only accepts markdown).
 * Missing Accept or a catch-all Accept → HTML (default).
 */
export function prefersMarkdown(acceptHeader: string | null): boolean {
    const entries = parseAccept(acceptHeader);
    if (entries.length === 0) return false;

    const markdownEntries = entries.filter((e) =>
        matches(e, "text", "markdown")
    );
    const htmlEntries = entries.filter((e) => matches(e, "text", "html"));

    const bestMarkdown = markdownEntries.sort(
        (a, b) => b.q - a.q || b.specificity - a.specificity
    )[0];
    const bestHtml = htmlEntries.sort(
        (a, b) => b.q - a.q || b.specificity - a.specificity
    )[0];

    // Explicitly refused markdown
    if (bestMarkdown && bestMarkdown.q === 0) return false;

    // Markdown requested with positive q
    if (bestMarkdown && bestMarkdown.q > 0) {
        // Prefer markdown when its q is strictly higher, or equal and more specific
        if (!bestHtml || bestHtml.q === 0) return true;
        if (bestMarkdown.q > bestHtml.q) return true;
        if (bestMarkdown.q === bestHtml.q) {
            // Same weight: prefer the more specific type listed first in Accept order
            // If both are equally specific, prefer markdown only when it appears first
            const markdownIndex = entries.findIndex((e) =>
                matches(e, "text", "markdown")
            );
            const htmlIndex = entries.findIndex((e) =>
                matches(e, "text", "html")
            );
            return (
                markdownIndex !== -1 &&
                (htmlIndex === -1 || markdownIndex < htmlIndex)
            );
        }
    }

    return false;
}
