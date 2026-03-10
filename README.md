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
