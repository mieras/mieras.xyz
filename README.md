# MIERAS.XYZ

Landing page voor Maarten Mieras — Digital Designer (Astro 5, brutalist design, dark mode, WeatherAPI).

## Ontwikkelen

```bash
npm install
cp .env.example .env
# Vul PUBLIC_WEATHER_API_KEY in .env in (optioneel; zonder key toont de header "--°C")
npm run dev
```

## Build & deploy

```bash
npm run build
```

De output staat in `dist/`. Deploy naar **Cloudflare Pages**: koppel de repo of upload `dist/`, build command `npm run build`, output directory `dist`.

## Environment

- **PUBLIC_WEATHER_API_KEY** — API key van [WeatherAPI.com](https://www.weatherapi.com/) voor temperatuur in de header (Rotterdam). Zie `.env.example`.

## T&C

Plaats je Algemene Voorwaarden-PDF in `public/terms.pdf` zodat de footer-link werkt.

## Domeinen

Zie [docs/DOMAIN-MIGRATION.md](docs/DOMAIN-MIGRATION.md) voor het migratieplan van domeinen naar Cloudflare.

## Structuur

```text
src/
  components/
    Header.astro
    ThemeToggle.astro
    MarqueeRefreshToggle.astro
    MarqueeSection.astro
    Main.astro
    Footer.astro
    SeoMeta.astro
    JsonLd.astro
  layouts/
    BaseLayout.astro
  pages/
    index.astro
  styles/
    _base.scss
    _tokens.scss
    global.scss
  content/
    config.ts
    main/main.md
    footer/footer.md
    marquee/marquees.yaml
    seo/seo.yaml
  lib/
    horizontalLoop.ts
    weather.ts
```

## Componenten

- `src/pages/index.astro`: stelt de pagina samen met `Header`, meerdere `MarqueeSection`s, `Main` en `Footer`; laadt content uit Astro collections en injecteert JSON-LD.
- `src/layouts/BaseLayout.astro`: globale shell (`<head>`, SEO, fonts, skip-link, global styles), initialiseert thema en smooth scroll (Lenis).
- `src/components/Header.astro`: merknaam, anchors/mail en controls (`MarqueeRefreshToggle` + `ThemeToggle`).
- `src/components/MarqueeSection.astro`: oneindige horizontale marquee met GSAP + ScrollTrigger + `horizontalLoop`.
- `src/components/Main.astro`: hoofdcontent (contact, studio, music/about, clients, services), copy-to-clipboard feedback en scroll animatie.
- `src/components/Footer.astro`: datum/tijd en temperatuur (WeatherAPI via `src/lib/weather.ts`).
- `src/components/SeoMeta.astro` en `src/components/JsonLd.astro`: metadata en structured data.

## SCSS-opbouw

- `src/styles/global.scss` is het entrypoint en `@use`t:
  - `src/styles/_base.scss` (reset + Utopia scales)
  - `src/styles/_tokens.scss` (kleur tokens per thema)
- Globale regels staan in `global.scss` (body, focus styles, skip-link, utility `.mono`).
- Component-specifieke styling staat lokaal in `<style>`/`<style scoped>` in de `.astro` componenten.

## Typografie

- Basisschrift: `'Neue Haas Grotesk Display Pro', sans-serif` (geladen in `BaseLayout.astro`).
- Monospace utility: `.mono` in `global.scss`.
- Fontgrootten komen uit Utopia custom properties (`--step-*`), bijvoorbeeld:
  - body: `var(--step-0)`
  - captions/meta: `var(--step--2)`
  - marquee: `var(--step-5)`

## Utopia (fluid type & spacing)

In `src/styles/_base.scss` worden met `utopia-core-scss` twee schalen gegenereerd:

- Type scale via `generateTypeScale(...)`
  - viewport: `360px` → `1920px`
  - base font: `18` → `20`
  - ratio: `1.2` → `1.333`
  - stappen: `--step--2` t/m `--step-5`
- Space scale via `generateSpaceScale(...)`
  - tokens zoals `--space-3xs`, `--space-2xs`, `--space-s`, `--space-l`, `--space-2xl`, etc.
  - custom token: `--space-s-l`

## Kleur & dark mode

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

### Gedrag

- `ThemeToggle.astro` wisselt `data-theme` op `<html>` en slaat de keuze op in `localStorage` (`theme` key).
- `BaseLayout.astro` initialiseert bij load:
  1. opgeslagen keuze (`light`/`dark`) heeft voorrang
  2. anders: `prefers-color-scheme`
- Als er geen handmatige keuze in `localStorage` staat, volgt de site runtime wijzigingen van OS theme.

## Content model (Astro collections)

`src/content/config.ts` definieert:

- `main` (content): tekstblokken + contact/clients/services
- `footer` (content): o.a. btw/kvk/bank gegevens
- `marquee` (data): lijst met marquee items (`order`, `text`, `backgroundColor`, `textColor`, `speed`)
- `seo` (data): person + organization schema data
