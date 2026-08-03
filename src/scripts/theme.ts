/**
 * Theme switching.
 *
 * The initial theme is applied by a blocking inline script in Layout.astro so
 * there's no flash of the wrong theme before paint. This module handles the
 * interactive parts: the toggle button, persistence, and re-applying the theme
 * after ClientRouter swaps the DOM (which restores `<html>` from server HTML
 * and would otherwise drop the `dark` class mid-navigation).
 */

const STORAGE_KEY = "theme";

type Theme = "light" | "dark";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** The user's explicit choice, or null when they're following the system. */
function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // localStorage can throw in private mode / when cookies are blocked.
    return null;
  }
}

function resolveIsDark(): boolean {
  const stored = storedTheme();
  return stored ? stored === "dark" : systemPrefersDark();
}

function syncButtonLabel(isDark: boolean) {
  const button = document.getElementById("theme-toggle");
  if (!button) return;
  button.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme"
  );
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  syncButtonLabel(isDark);
}

function bindToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button || button.dataset.bound === "true") return;
  button.dataset.bound = "true";

  button.addEventListener("click", () => {
    const next: Theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal: the theme still applies for this page view.
    }
    applyTheme(next === "dark");
  });
}

declare global {
  interface Window {
    __themeBound?: boolean;
  }
}

if (!window.__themeBound) {
  window.__themeBound = true;

  // Re-apply before the new page paints, so the theme doesn't flicker
  // during a client-side navigation.
  document.addEventListener("astro:after-swap", () => applyTheme(resolveIsDark()));

  // The button is re-rendered each navigation, so re-bind each time.
  document.addEventListener("astro:page-load", () => {
    applyTheme(resolveIsDark());
    bindToggle();
  });

  // Follow the OS only while the user hasn't made an explicit choice.
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      if (!storedTheme()) applyTheme(event.matches);
    });
}

export {};
