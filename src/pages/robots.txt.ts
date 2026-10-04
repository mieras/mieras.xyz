import type { APIRoute } from "astro";
import { buildRobotsTxt } from "../lib/ai-policy";

export const prerender = false;

export const GET: APIRoute = ({ site }) => {
    const origin = site ?? new URL("https://mieras.xyz");
    return new Response(buildRobotsTxt(origin), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
