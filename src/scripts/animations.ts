/**
 * Scroll reveals and number counters.
 *
 * Design rule: **nothing that controls content visibility may depend on
 * requestAnimationFrame.** Browsers freeze rAF in backgrounded tabs, and an
 * animation library whose ticker is frozen leaves `opacity: 0` content
 * permanently invisible — a blank page for anyone who opens the site in a
 * background tab. So:
 *
 *   - the hero intro is a pure CSS animation (see globals.css),
 *   - scroll reveals use IntersectionObserver + CSS transitions,
 *   - counters step on a plain timer.
 *
 * All of these still run (or settle at their end state) when rAF is frozen.
 *
 * This must also be idempotent: Astro's ClientRouter re-executes page scripts
 * on navigation, so everything here can run repeatedly against the same DOM.
 */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const REVEAL_SELECTOR = ".fade-in-section, .project-card";
const COUNTER_DURATION = 1400;

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

let observer: IntersectionObserver | undefined;
/** Targets still awaiting reveal, kept in sync so the sweep can check them. */
const observed = new Set<HTMLElement>();
/** Active counter timers, so a re-run can cancel the previous pass. */
const counterTimers = new Map<HTMLElement, ReturnType<typeof setInterval>>();

function stopCounter(el: HTMLElement) {
  const timer = counterTimers.get(el);
  if (timer !== undefined) {
    clearInterval(timer);
    counterTimers.delete(el);
  }
}

function setCounterToTarget(el: HTMLElement) {
  stopCounter(el);
  const target = el.dataset.target;
  if (target) el.textContent = target;
}

function runCounter(el: HTMLElement) {
  const target = Number(el.dataset.target);
  if (!Number.isFinite(target)) return;

  stopCounter(el);
  const start = Date.now();

  // setInterval rather than rAF: throttled in background tabs but never
  // frozen, so the counter always reaches its target.
  const timer = setInterval(() => {
    const progress = Math.min(1, (Date.now() - start) / COUNTER_DURATION);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(target * eased));

    if (progress >= 1) {
      stopCounter(el);
      el.textContent = String(target); // exact value, no rounding drift
    }
  }, 32);

  counterTimers.set(el, timer);
}

/** Show every reveal target immediately, no animation. */
function revealEverything() {
  document
    .querySelectorAll<HTMLElement>(REVEAL_SELECTOR)
    .forEach((el) => el.classList.add("is-visible"));
  document
    .querySelectorAll<HTMLElement>(".stat-number")
    .forEach(setCounterToTarget);
}

/**
 * Backstop sweep for elements IntersectionObserver never reports.
 *
 * IO only fires on threshold *crossings*. A jump scroll (anchor link, End key,
 * browser scroll restoration) can take an element straight from below the
 * viewport to above it without ever intersecting, so no callback fires and the
 * element would stay hidden permanently. This reveals anything that has
 * reached or passed the viewport.
 */
function sweepVisible() {
  if (!observed.size) return;

  const revealLine = window.innerHeight * 0.92;

  observed.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top >= revealLine) return;

    if (el.classList.contains("stat-number")) {
      // Already scrolled past: just show the number, don't animate off-screen.
      if (rect.bottom < 0) setCounterToTarget(el);
      else runCounter(el);
    } else {
      el.classList.add("is-visible");
    }

    observer?.unobserve(el);
    observed.delete(el);
  });
}

let sweepScheduled = false;
function scheduleSweep() {
  if (sweepScheduled) return;
  sweepScheduled = true;
  setTimeout(() => {
    sweepScheduled = false;
    sweepVisible();
  }, 120);
}

function observeReveals() {
  observer?.disconnect();
  observed.clear();

  const targets = document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
  const counters = document.querySelectorAll<HTMLElement>(".stat-number");

  // Without IntersectionObserver, show everything rather than gate content
  // behind a feature the browser lacks.
  if (typeof IntersectionObserver === "undefined") {
    revealEverything();
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        const scrolledPast = entry.boundingClientRect.bottom < 0;
        if (!entry.isIntersecting && !scrolledPast) return;

        if (el.classList.contains("stat-number")) {
          if (scrolledPast) setCounterToTarget(el);
          else runCounter(el);
        } else {
          el.classList.add("is-visible");
        }

        observer?.unobserve(el);
        observed.delete(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
  );

  targets.forEach((el) => {
    el.classList.remove("is-visible");
    observed.add(el);
    observer?.observe(el);
  });
  counters.forEach((el) => {
    stopCounter(el);
    el.textContent = "0";
    observed.add(el);
    observer?.observe(el);
  });

  // Catch anything already at or above the viewport on load (e.g. the browser
  // restored a scroll position), which IO won't report as a crossing.
  sweepVisible();
}

export function initAnimations() {
  if (prefersReducedMotion()) {
    observer?.disconnect();
    observed.clear();
    revealEverything();
    return;
  }

  observeReveals();
}

/**
 * Register listeners exactly once. Guarded on `window` because ClientRouter
 * re-evaluates this module on every navigation, and a bare addEventListener
 * at module scope would stack duplicate handlers.
 */
declare global {
  interface Window {
    __portfolioAnimationsBound?: boolean;
    __contactBound?: boolean;
  }
}

if (!window.__portfolioAnimationsBound) {
  window.__portfolioAnimationsBound = true;

  document.addEventListener("astro:page-load", initAnimations);

  // Backstop for jump scrolls that IntersectionObserver never reports.
  window.addEventListener("scroll", scheduleSweep, { passive: true });
  window.addEventListener("resize", scheduleSweep, { passive: true });

  document.addEventListener("astro:before-swap", () => {
    observer?.disconnect();
    observed.clear();
    counterTimers.forEach((timer) => clearInterval(timer));
    counterTimers.clear();
  });

  // Honour reduced motion if it's switched on mid-session.
  window.matchMedia(REDUCED_MOTION).addEventListener("change", (event) => {
    if (event.matches) {
      observer?.disconnect();
      observed.clear();
      revealEverything();
    }
  });
}

export {};
