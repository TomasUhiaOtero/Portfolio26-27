/**
 * Pure per-frame integrator for `HeroParticleText.jsx` — the particle
 * rendering of the hero's "full-stack" line.
 *
 * `particles` is an array of `{ hx, hy, x, y, vx, vy }`: `hx/hy` is the
 * home slot (a sampled glyph pixel), `x/y` the live position, `vx/vy` the
 * velocity carried only by the pointer shove.
 *
 * Each call, per particle: if within `radius` px of the pointer, add a
 * repel impulse to the velocity (linear falloff to zero at the edge, plus
 * an optional tangential `swirl`); apply `friction` to the velocity and
 * integrate it; then pull the position straight back toward its home slot
 * by `ret` (a direct lerp, NOT a spring — no velocity, so no oscillation,
 * which is what keeps the settle looking fluid).
 *
 * Mutates the array in place; kept out of the component so the arithmetic
 * is unit-testable without a real canvas (jsdom has no 2D context).
 */
export function stepParticles(particles, { px, py, radius, repel, friction, ret, swirl = 0 }) {
  const radiusSq = radius * radius;

  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];

    const dx = p.x - px;
    const dy = p.y - py;
    const distSq = dx * dx + dy * dy;

    if (distSq < radiusSq && distSq > 0.01) {
      const dist = Math.sqrt(distSq);
      const force = (1 - dist / radius) * repel;
      const nx = dx / dist;
      const ny = dy / dist;
      p.vx += nx * force - ny * force * swirl;
      p.vy += ny * force + nx * force * swirl;
    }

    p.vx *= friction;
    p.vy *= friction;
    p.x += p.vx;
    p.y += p.vy;

    p.x += (p.hx - p.x) * ret;
    p.y += (p.hy - p.y) * ret;
  }

  return particles;
}
