// @ts-check
import { defineConfig } from 'astro/config';
import { execSync } from 'node:child_process';

import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json' with { type: 'json' };

function getBuildInfo() {
  try {
    return {
      version: pkg.version,
      commitHash: execSync('git rev-parse --short HEAD').toString().trim(),
      // Commit date, not build date — this is "what code is live," which is
      // what commit HEAD points at, not when Vercel happened to run the build.
      commitDate: execSync('git log -1 --format=%cI').toString().trim(),
    };
  } catch {
    // No git history available (e.g. a shallow clone or a build run outside
    // a git checkout). Fall back to just the package version rather than
    // failing the build over a footer detail.
    return { version: pkg.version, commitHash: null, commitDate: null };
  }
}

// https://astro.build/config
export default defineConfig({
  // Update this if a custom domain gets attached later — Vercel keeps this
  // URL working as an alias either way, so nothing breaks if it's not updated,
  // but the custom domain would then be the canonical one search engines see.
  site: 'https://personal-portfolio-six-pi-45.vercel.app',

  vite: {
    plugins: [tailwindcss()],
    define: {
      __BUILD_INFO__: JSON.stringify(getBuildInfo()),
    },
  }
});
