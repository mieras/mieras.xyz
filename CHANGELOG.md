# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Fixed
- Mobile layout not filling viewport: added `initial-scale=1` to viewport meta and `overflow-x: clip` to `html` to prevent marquee overflow from triggering zoom-out on iOS Safari

---

## 2026-03-19 (3)

### Added
- Scroll-direction control for all marquees: direction locks to last scroll direction and reverses when scrolling the other way
- Spotify marquee smoothly decelerates to a stop on hover instead of cutting instantly
- `--leading-body` design token for body text line-height
- `--font-sans` and `--font-mono` tokens in `_tokens.scss`
- KVK/BTW/IBAN labels hidden by default, revealed on hover with elastic spring animation

### Changed
- Marquee animation engine replaced: CSS `@keyframes` → `gsap.ticker` updating `style.transform` directly on one element per marquee
- Body text in main upgraded from `--step--1` to `--step-0`

---

## 2026-03-19 (2)

### Added
- "Now playing" label in Spotify marquee (pill, left-aligned, frosted glass)

### Fixed
- Load `.env` vars into `process.env` in dev via `loadEnv` in `astro.config.mjs`

---

## 2026-03-19

### Fixed
- Render date and year client-side in footer to prevent SSR hydration mismatch
- Renamed `PUBLIC_WEATHER_API_KEY` → `WEATHER_API_KEY` (server-side secret, not exposed to client)
- Use `process.env` instead of `import.meta.env` for server-side secrets
- Restored `gsap.registerPlugin(ScrollTrigger)` in marquee components after SSR refactor

### Changed
- Enabled SSR: migrated from static output to Netlify adapter + upgraded to Astro 6

---

## 2026-03-18

### Added
- Spotify recently played marquee (`SpotifyMarquee.astro` + `/api/spotify` endpoint)
- Weather icon next to temperature in footer

### Fixed
- Marquee jank and performance issues (deduplication of `registerPlugin`, fixed `will-change`)
- Spotify tracks now included in chaos mode shuffle

### Changed
- `ThemeToggle` moved to fixed bottom-right with blur circle style
- `ThemeToggle` component refactored for improved readability

---

## 2026-03-10

### Added
- Custom shuffle cursor with GSAP follow animation, circle style, and click-to-chaos interaction

### Changed
- Header refactored to 4-column CSS grid matching Figma layout
- Mobile chaos range and marquee styles adjusted for improved layout

---

## Earlier

- Marquee section with GSAP horizontal loop + ScrollTrigger
- Brutalist design system with Utopia fluid type & spacing
- Dark/light mode with `localStorage` persistence and OS preference fallback
- WeatherAPI integration for live temperature in footer (Rotterdam)
- SEO metadata and JSON-LD structured data
- Astro content collections for copy, marquee items, and SEO data
