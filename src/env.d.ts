/// <reference types="astro/client" />

/**
 * Injected at build time by astro.config.mjs via Vite's `define` — a
 * textual replacement, not a runtime import, so it has zero bundle cost.
 */
declare const __BUILD_INFO__: {
  version: string;
  commitHash: string | null;
  commitDate: string | null;
};
