// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { loadEnv } from 'vite';

// Inject .env variables into process.env so SSR code can use process.env.*
// (Vite only exposes them via import.meta.env by default)
const env = loadEnv('', process.cwd(), '');
Object.assign(process.env, env);

// https://astro.build/config
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
