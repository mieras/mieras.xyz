# MIERAS.XYZ

Personal landing page for Maarten Mieras — Digital Designer. Built with Astro 6, SSR via Netlify adapter, brutalist design, dark mode, WeatherAPI, and Spotify integration.

## Develop

```bash
npm install
cp .env.example .env
# Fill in WEATHER_API_KEY and SPOTIFY_* in .env (optional; see Environment section)
npm run dev
```

## Build & deploy

```bash
npm run build
```

Output goes to `dist/`. Deployed to **Netlify**: connect the repo, build command `npm run build`, publish directory `dist`.

## Environment

| Variable                | Required | Description                                                                                                                   |
| ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `WEATHER_API_KEY`       | No       | [WeatherAPI.com](https://www.weatherapi.com/) key for temperature in the footer (Rotterdam). Without it, footer shows `--°C`. |
| `SPOTIFY_CLIENT_ID`     | No       | Spotify app client ID for recently played marquee.                                                                            |
| `SPOTIFY_CLIENT_SECRET` | No       | Spotify app client secret.                                                                                                    |
| `SPOTIFY_REFRESH_TOKEN` | No       | Spotify OAuth refresh token.                                                                                                  |

See `.env.example` for all variables.

## T&C

Place your terms & conditions PDF at `public/terms.pdf` for the footer link to work.

## AI readiness

This site is set up for AI agents and answer engines while keeping classical search. Default policy:

| Signal     | Value | Meaning                                   |
| ---------- | ----- | ----------------------------------------- |
| `search`   | `yes` | Indexing / search results allowed         |
| `ai-input` | `yes` | Grounding / RAG / live AI answers allowed |
| `ai-train` | `no`  | Model training / fine-tuning refused      |

These preferences are expressed in `robots.txt` and the `Content-Signal` HTTP header. They are **not hard blocks** — cooperating crawlers honour them; enforcement needs a WAF / bot product (e.g. Cloudflare AI Crawl Control).

### What this repo ships

| Endpoint / behaviour                                            | Role                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| `/robots.txt`                                                   | Crawl rules, Content Signals Policy, sitemap URL      |
| `/sitemap.xml`                                                  | Public URL map (SSR-friendly; not `@astrojs/sitemap`) |
| `Accept: text/markdown` on `/`                                  | Clean Markdown for agents; browsers still get HTML    |
| `Content-Signal` header                                         | Same policy on HTML + Markdown responses              |
| `<link rel="sitemap">` + `rel="alternate" type="text/markdown"` | Discovery hints in `<head>`                           |

Policy and crawler lists live in one place: [`src/lib/ai-policy.ts`](src/lib/ai-policy.ts).

- **Allowed AI agents:** search/citation + user-initiated fetchers (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`)
- **Disallowed:** training crawlers / opt-out tokens (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`, …)
- **Mixed-purpose** (`Googlebot`, `Bingbot`, `Applebot`): left under `User-agent: *` so search visibility is kept

### Quick tests

```bash
# robots + Content Signals
curl -sS https://mieras.xyz/robots.txt

# sitemap
curl -sS https://mieras.xyz/sitemap.xml

# HTML (browser default)
curl -sSI https://mieras.xyz/ | grep -iE 'content-type|content-signal|vary'

# Markdown for agents
curl -sSI -H 'Accept: text/markdown' https://mieras.xyz/ | grep -iE 'content-type|content-signal|vary'
curl -sS -H 'Accept: text/markdown' https://mieras.xyz/ | head
```

Locally, use `npm run dev` and the same `curl` commands against `http://localhost:4321` (the Netlify adapter does not support `astro preview`).

### Reuse in other projects

1. Copy the policy idea: one source of truth for signals + allow/disallow lists.
2. Publish `robots.txt` (with Content Signals Policy comments + `Sitemap:`) and a real sitemap.
3. Serve Markdown on the same URL when `Accept: text/markdown` wins over HTML (parse `q` values; set `Vary: Accept`).
4. Mirror the policy in a `Content-Signal` response header on public pages.
5. Document that robots/signals are preferences; add platform bot rules if you need enforcement.

**Astro / Netlify (this pattern):** dynamic routes (`robots.txt.ts`, `sitemap.xml.ts`) + middleware for negotiation — works without Cloudflare.

**Other SSR frameworks:** same HTTP contract (robots, sitemap, Accept negotiation, Content-Signal); only the middleware / route wiring differs.

**Cloudflare (optional later):** Markdown for Agents, Bot Preference Sync / managed robots.txt, AI Crawl Control for hard blocks, Agent Readiness scan to verify the five quick wins. Origin headers still win when you set `Content-Signal` yourself.

## Structure

```text
src/
  components/
    Header.astro
    ThemeToggle.astro
    MarqueeRefreshToggle.astro
    MarqueeSection.astro
    SpotifyMarquee.astro
    Main.astro
    Footer.astro
    SeoMeta.astro
    JsonLd.astro
  layouts/
    BaseLayout.astro
  middleware.ts
  pages/
    index.astro
    robots.txt.ts
    sitemap.xml.ts
  styles/
    _base.scss
    _tokens.scss
    global.scss
  content/
    main/main.md
    footer/footer.md
    marquee/marquees.yaml
    seo/seo.yaml
  lib/
    ai-policy.ts
    accept.ts
    home-markdown.ts
    horizontalLoop.ts
    weather.ts
    spotify.ts
```

## Components

- `src/pages/index.astro` — assembles the page with `Header`, multiple `MarqueeSection`s, `SpotifyMarquee`, `Main`, and `Footer`; loads content from Astro collections and injects JSON-LD.
- `src/layouts/BaseLayout.astro` — global shell (`<head>`, SEO, fonts, skip-link, global styles), initialises theme and smooth scroll (Lenis).
- `src/components/Header.astro` — brand name, anchors/mail, and controls (`MarqueeRefreshToggle` + `ThemeToggle`).
- `src/components/MarqueeSection.astro` — infinite horizontal marquee with GSAP + ScrollTrigger + `horizontalLoop`.
- `src/components/SpotifyMarquee.astro` — marquee showing recently played Spotify tracks, fetched via the `/api/spotify` endpoint.
- `src/components/Main.astro` — main content (contact, studio, music/about, clients, services), copy-to-clipboard feedback, and scroll animation.
- `src/components/Footer.astro` — live date/time and temperature (WeatherAPI via `src/lib/weather.ts`), rendered client-side.
- `src/components/SeoMeta.astro` and `src/components/JsonLd.astro` — metadata and structured data.

## SCSS

- `src/styles/global.scss` is the entrypoint and `@use`s:
    - `src/styles/_base.scss` (reset + Utopia scales)
    - `src/styles/_tokens.scss` (colour tokens per theme)
- Global rules live in `global.scss` (body, focus styles, skip-link, utility `.mono`).
- Component-specific styling lives locally in `<style>` / `<style scoped>` in `.astro` components.

## Typography

- Base font: `'Neue Haas Grotesk Display Pro', sans-serif` (loaded in `BaseLayout.astro`).
- Monospace utility: `.mono` in `global.scss`.
- Font sizes come from Utopia custom properties (`--step-*`), e.g.:
    - body: `var(--step-0)`
    - captions/meta: `var(--step--2)`
    - marquee: `var(--step-5)`

## Utopia (fluid type & spacing)

In `src/styles/_base.scss`, `utopia-core-scss` generates two scales:

- Type scale via `generateTypeScale(...)`
    - viewport: `360px` → `1920px`
    - base font: `18` → `20`
    - ratio: `1.2` → `1.333`
    - steps: `--step--2` through `--step-5`
- Space scale via `generateSpaceScale(...)`
    - tokens like `--space-3xs`, `--space-2xs`, `--space-s`, `--space-l`, `--space-2xl`, etc.
    - custom token: `--space-s-l`

## Colour & dark mode

### Tokens

In `src/styles/_tokens.scss`:

- Light (`:root`, `[data-theme="light"]`)
    - `--color-bg: #f5f5f0`
    - `--color-text: #1a1a1a`
    - `--color-text-muted: #4a4a4a`
    - `--color-accent: #1a1a1a`
    - `--color-border: #ccc`
- Dark (`[data-theme="dark"]`)
    - `--color-bg: #0d0d0d`
    - `--color-text: #f0f0eb`
    - `--color-text-muted: #a0a0a0`
    - `--color-accent: #f0f0eb`
    - `--color-border: #333`

### Behaviour

- `ThemeToggle.astro` toggles `data-theme` on `<html>` and persists the choice in `localStorage` (`theme` key).
- `BaseLayout.astro` initialises on load:
    1. stored choice (`light`/`dark`) takes priority
    2. fallback: `prefers-color-scheme`
- If no manual choice is stored, the site follows OS theme changes at runtime.

## Content model (Astro collections)

- `main` (content): text blocks + contact/clients/services
- `footer` (content): VAT/KVK/bank details etc.
- `marquee` (data): list of marquee items (`order`, `text`, `backgroundColor`, `textColor`, `speed`)
- `seo` (data): person + organisation schema data
