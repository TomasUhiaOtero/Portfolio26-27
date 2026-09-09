import { useEffect, useRef, useState } from "react";

// Narrows the intersection zone to a horizontal band across the middle
// of the viewport, so "active" means "crossing the middle of the
// screen" rather than "any part on screen" — the usual definition for a
// scrollspy nav.
const ROOT_MARGIN = "-45% 0px -45% 0px";

/**
 * Tracks which of the given section ids is currently in view, defaulting
 * to `ids[0]`. Uses a single IntersectionObserver over every element
 * that exists today, keeps the latest entry per id in a Map, and on
 * every callback picks the topmost (smallest `boundingClientRect.top`)
 * id that is currently intersecting.
 *
 * Deliberately never touches `scrollY`: with sections of differing
 * height, a scrollY-based threshold drifts out of sync with what's
 * actually on screen. The observer is the source of truth instead.
 *
 * Only `#inicio` exists as of Task 7 — `document.getElementById` simply
 * returns `null` for the rest, which are filtered out below, so this
 * hook neither throws nor warns before Tasks 8–16 add the missing
 * sections, and it picks them up automatically once they exist because
 * the effect re-runs whenever the id list's content changes.
 */
export default function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  const entriesRef = useRef(new Map());

  // Depend on the ids' content, not the array reference: a caller that
  // passes a freshly-mapped array every render (as SideRail's inline
  // `t.nav.links.map(...)` would without its own memoisation) must not
  // tear the observer down and rebuild it on every render.
  const key = ids.join("|");

  useEffect(() => {
    const currentIds = key.length > 0 ? key.split("|") : [];
    const elements = currentIds
      .map((id) => document.getElementById(id))
      .filter((el) => el !== null);

    if (elements.length === 0) return undefined;

    const entries = entriesRef.current;
    entries.clear();

    const observer = new IntersectionObserver(
      (observedEntries) => {
        for (const entry of observedEntries) {
          entries.set(entry.target.id, entry);
        }

        let topId = null;
        let topPosition = Infinity;
        for (const id of currentIds) {
          const entry = entries.get(id);
          if (
            entry?.isIntersecting &&
            entry.boundingClientRect.top < topPosition
          ) {
            topPosition = entry.boundingClientRect.top;
            topId = id;
          }
        }

        // No intersecting entry means "still between two sections" (or a
        // reduced-motion jump mid-flight) — keep the last known section
        // rather than flicker to nothing.
        if (topId) setActive(topId);
      },
      { rootMargin: ROOT_MARGIN },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [key]);

  return active;
}
