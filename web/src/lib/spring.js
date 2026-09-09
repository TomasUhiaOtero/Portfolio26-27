// A hand-rolled critically-damped-ish spring rather than GSAP's inertia
// plugin: it is fifteen lines, deterministic, and unit testable — and it
// keeps the carousel free of any paid plugin.

const MAX_DT = 1 / 30; // A tab returning from the background can hand us a
                       // multi-second delta; integrating it explodes the spring.

export function createSpring({ stiffness = 120, damping = 20, mass = 1 } = {}) {
  let value = 0;
  let velocity = 0;
  let goal = 0;

  return {
    set(next) {
      value = next;
      velocity = 0;
      goal = next;
    },
    target(next) {
      goal = next;
    },
    step(dt) {
      const t = Math.min(dt, MAX_DT);
      const force = -stiffness * (value - goal);
      const drag = -damping * velocity;
      velocity += ((force + drag) / mass) * t;
      value += velocity * t;
      return value;
    },
    isSettled() {
      return Math.abs(goal - value) < 0.001 && Math.abs(velocity) < 0.001;
    },
    get current() {
      return value;
    },
  };
}
