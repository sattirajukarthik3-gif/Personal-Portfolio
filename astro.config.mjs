// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Update this if a custom domain gets attached later — Vercel keeps this
  // URL working as an alias either way, so nothing breaks if it's not updated,
  // but the custom domain would then be the canonical one search engines see.
  site: 'https://personal-portfolio-six-pi-45.vercel.app',

  vite: {
    plugins: [tailwindcss()]
  }
});
