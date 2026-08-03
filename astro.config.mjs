// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO: set this to the real domain once deployed, e.g.
  //   site: 'https://karthiksattiraju.com'
  // Until it's set, the layout omits canonical/og:url rather than emitting a
  // localhost URL, which would otherwise ship to production and hurt SEO.
  site: undefined,

  vite: {
    plugins: [tailwindcss()]
  }
});
