import { defineMiddleware } from "astro:middleware";
import { prefersMarkdown } from "./lib/accept";
import { contentSignalValue } from "./lib/ai-policy";
import { buildHomeMarkdown } from "./lib/home-markdown";

function isHomePath(pathname: string): boolean {
    return pathname === "/" || pathname === "";
}

function withAiHeaders(
    response: Response,
    includeVaryAccept: boolean
): Response {
    const headers = new Headers(response.headers);
    headers.set("Content-Signal", contentSignalValue);

    if (includeVaryAccept) {
        const existing = headers.get("Vary");
        if (!existing) {
            headers.set("Vary", "Accept");
        } else if (
            !existing
                .split(",")
                .map((v) => v.trim().toLowerCase())
                .includes("accept")
        ) {
            headers.set("Vary", `${existing}, Accept`);
        }
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;

    if (
        isHomePath(pathname) &&
        prefersMarkdown(context.request.headers.get("accept"))
    ) {
        try {
            const markdown = await buildHomeMarkdown();
            return new Response(markdown, {
                status: 200,
                headers: {
                    "Content-Type": "text/markdown; charset=utf-8",
                    Vary: "Accept",
                    "Content-Signal": contentSignalValue,
                    "Cache-Control": "public, max-age=300",
                },
            });
        } catch {
            // Fall through to HTML if Markdown generation fails
        }
    }

    const response = await next();
    const contentType = response.headers.get("Content-Type") ?? "";

    if (contentType.includes("text/html")) {
        return withAiHeaders(response, isHomePath(pathname));
    }

    return response;
});
