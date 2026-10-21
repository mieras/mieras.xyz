// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

/**
 * Load .env* into process.env with **file values winning** over inherited shell
 * exports. Vite's loadEnv('', …) prefers process.env, which poisoned local
 * TMDB_API_KEY with a stale short value and emptied the Watch feed.
 */
function injectEnvFiles() {
  const cwd = process.cwd();
  const files = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.development.local',
  ];

  for (const file of files) {
    const filePath = path.join(cwd, file);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;

      const key = trimmed.slice(0, eq).replace(/^export\s+/, '').trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

injectEnvFiles();

// https://astro.config
export default defineConfig({
  site: 'https://mieras.xyz',
  adapter: netlify(),
  image: {
    // Remote covers/posters via Netlify Image CDN (no third-party requests from visitors)
    domains: [
      'i.gr-assets.com',
      'm.media-amazon.com',
      'images-na.ssl-images-amazon.com',
      'image.tmdb.org',
      'i.discogs.com',
      'thumbnailer.mixcloud.com',
      'i.scdn.co',
      'mosaic.scdn.co',
    ],
  },
});
