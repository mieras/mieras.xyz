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

| Variable | Required | Description |
|---|---|---|
| `WEATHER_API_KEY` | No | [WeatherAPI.com](https://www.weatherapi.com/) key for temperature in the footer (Rotterdam). Without it, footer shows `--°C`. |
| `SPOTIFY_CLIENT_ID` | No | Spotify app client ID for recently played marquee. |
| `SPOTIFY_CLIENT_SECRET` | No | Spotify app client secret. |
| `SPOTIFY_REFRESH_TOKEN` | No | Spotify OAuth refresh token. |

See `.env.example` for all variables.

## T&C

Place your terms & conditions PDF at `public/terms.pdf` for the footer link to work.

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
  pages/
    index.astro
    api/
      spotify.ts
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
    horizontalLoop.ts
    weather.ts
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
