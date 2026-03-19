# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Fixed
- Remove `backdrop-filter` from animated cursor and Spotify "now playing" label to reduce style recalcs
- Replace GSAP per-item marquee animation (56 elements/frame) with CSS `@keyframes` on the container — zero per-frame JS for all marquees
- Reduce marquee DOM copies from 8 to 2 per strip; hover pause via `animation-play-state`, direction via `animation-direction`
- Add `will-change: transform` to marquee inner containers

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
