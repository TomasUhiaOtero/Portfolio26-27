/**
 * Pure orbital math for `TechCore.jsx`, factored out for the same reason
 * `colorTransition.js` and `neighbourLines.js` were: it has a provable right
 * answer and doesn't need a live WebGL frame loop (or even "three" itself)
 * to test.
 *
 * `TechCore` orbits one `InstancedMesh` of nodes around the wireframe core.
 * Two things vary per technology-group stage: how many nodes are actually
 * "on" (the group's own item count — see `nodeCountForStage`) and the ring
 * they travel (radius/inclination/angular speed — see `orbit.js`'s caller,
 * `TechCore.jsx`, for the four `STAGE_ORBITS` presets). Stage changes tween
 * those ring values via a single `gsap.to` on a plain object (see hazard 3
 * in the task brief); this module supplies the read side of that: turning
 * {radius, inclination, angle} into a position, and a target node count
 * into a per-instance visibility, every frame.
 */

/**
 * The node's own orbital angle at a given elapsed time: an even spread
 * around the ring (`index / capacity` of a full turn) plus continuous
 * rotation at `speed` radians/second. `capacity` is the ring's total slot
 * count (the max across every stage), not the current stage's active
 * count, so a node's slot never reflows when the active count changes —
 * only its visibility (see `instanceVisibility`) does.
 */
export function nodeAngle(index, capacity, elapsed, speed) {
  const base = capacity > 0 ? (index / capacity) * Math.PI * 2 : 0;
  return base + elapsed * speed;
}

/**
 * A node's position on a ring of the given `radius`, tilted by
 * `inclination` radians away from the XZ plane. At `inclination === 0`
 * this is a flat circle in XZ (`y` stays 0); increasing it lifts/drops the
 * ring into a tilted ellipse as seen from the camera, the same way each of
 * `TechCore`'s four stage presets reads as a visually distinct orbit.
 */
export function orbitPosition({ radius, inclination, angle }) {
  const x = radius * Math.cos(angle);
  const y = -radius * Math.sin(angle) * Math.sin(inclination);
  const z = radius * Math.sin(angle) * Math.cos(inclination);
  return [x, y, z];
}

/**
 * How "on" instance `index` is for a (possibly fractional, mid-tween)
 * active `count`: 1 while fully inside the active range, 0 once past it,
 * and a fractional value for the one instance currently crossing the
 * boundary — so the ring visibly grows/shrinks a node at a time as `count`
 * tweens between two stages' item totals (e.g. 6 -> 4) instead of every
 * node jumping in size at once. Clamped to [0, 1] so a `count` outside the
 * instance's own index still resolves to fully on/off rather than a
 * negative or >1 scale.
 */
export function instanceVisibility(index, count) {
  return Math.max(0, Math.min(1, count - index));
}

/**
 * How many nodes stage `stage` should show: the length of that stage's
 * `stack.groups` items, so the object always matches the copy (an added
 * fifth item in a future content edit is picked up with no code change).
 * Missing/out-of-range stages resolve to 0 rather than throwing, the same
 * defensive shape `progressToStage`'s consumers rely on elsewhere in this
 * section.
 */
export function nodeCountForStage(stage, groups) {
  return groups[stage]?.items.length ?? 0;
}
