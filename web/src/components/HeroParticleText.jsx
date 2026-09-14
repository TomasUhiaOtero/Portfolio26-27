import { useEffect, useRef } from "react";
import useReducedMotion from "../hooks/useReducedMotion.js";
import { stepParticles } from "../lib/particleText.js";

// Repel strength, per-frame velocity friction, the direct pull back
// toward each glyph pixel's home slot, and a small tangential swirl. The
// influence radius is derived from the font size at build time so it
// scales with the headline.
const REPEL = 2.4;
const FRICTION = 0.86;
const RETURN = 0.12;
const SWIRL = 0.18;

// Upper bound on particle count — the sample gap widens until the word
// fits under this, so a huge headline on a hi-dpi screen can't spawn tens
// of thousands of draw calls per frame.
const MAX_PARTICLES = 7000;

/**
 * The hero's "full-stack" line, rendered as a dense field of small square
 * particles sampled from the word's own glyphs: they scatter away from
 * the pointer and ease straight back. An inline replacement for one line
 * of the `<h1>` (see Hero.jsx), so the real word is kept in an `sr-only`
 * span for the accessible name and an invisible copy sizes the box the
 * canvas fills.
 *
 * Under `prefers-reduced-motion` it renders as plain accent-coloured text
 * — no canvas, no rAF. The 2D context is also absent in jsdom, so the
 * effect simply no-ops there.
 */
export default function HeroParticleText({ text }) {
  const reduced = useReducedMotion();
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: -99999, y: -99999 });
  const rectRef = useRef({ left: 0, top: 0 });
  const particlesRef = useRef([]);
  const metricsRef = useRef({ radius: 120, dot: 1 });
  const colorRef = useRef("#0a84ff");

  useEffect(() => {
    if (reduced) return undefined;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext?.("2d");
    if (!wrap || !canvas || !ctx) return undefined;

    let raf = 0;
    let cancelled = false;
    let dpr = 1;

    const readAccent = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#0a84ff";
    colorRef.current = readAccent();

    // The pointer is stored in viewport coords; the frame loop needs it
    // relative to the canvas. Cache the canvas rect and refresh it only
    // when it can actually change (scroll / resize / pointer move) rather
    // than calling getBoundingClientRect on every frame — that per-frame
    // layout read is a real source of stutter.
    const refreshRect = () => {
      rectRef.current = wrap.getBoundingClientRect();
    };

    // Sample the word's glyph pixels into particle home slots. The gap
    // starts tight (a dense, "made of pixels" look) and only widens if the
    // count would blow past MAX_PARTICLES.
    const build = () => {
      refreshRect();
      const w = Math.max(1, Math.round(rectRef.current.width));
      const h = Math.max(1, Math.round(rectRef.current.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const cs = getComputedStyle(wrap);
      const fontPx = parseFloat(cs.fontSize) || 48;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fontPx * dpr}px ${cs.fontFamily}`;
      ctx.fillText(text, 0, canvas.height * 0.52);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      const sample = (gap) => {
        const pts = [];
        for (let y = 0; y < canvas.height; y += gap) {
          for (let x = 0; x < canvas.width; x += gap) {
            if (data[(y * canvas.width + x) * 4 + 3] > 128) {
              const homeX = x / dpr;
              const homeY = y / dpr;
              pts.push({ hx: homeX, hy: homeY, x: homeX, y: homeY, vx: 0, vy: 0 });
            }
          }
        }
        return pts;
      };

      let gap = Math.max(2, Math.round((fontPx * dpr) / 90));
      let particles = sample(gap);
      while (particles.length > MAX_PARTICLES && gap < 16) {
        gap += 1;
        particles = sample(gap);
      }

      particlesRef.current = particles;
      metricsRef.current = {
        radius: Math.max(70, fontPx * 1.35),
        dot: Math.max(1, Math.round((fontPx * dpr) / 90)) / dpr,
      };
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    build();
    // One more build next frame: the first can land before fonts / layout
    // have settled, leaving a tiny or empty particle cloud.
    const deferredBuild = requestAnimationFrame(() => build());

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;

      const { radius, dot } = metricsRef.current;
      const particles = particlesRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.fillStyle = colorRef.current;

      stepParticles(particles, {
        px: pointerRef.current.x - rectRef.current.left,
        py: pointerRef.current.y - rectRef.current.top,
        radius,
        repel: REPEL,
        friction: FRICTION,
        ret: RETURN,
        swirl: SWIRL,
      });

      const side = dot * 2;
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        ctx.fillRect(p.x - dot, p.y - dot, side, side);
      }
    };
    raf = requestAnimationFrame(frame);

    const onMove = (e) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      refreshRect();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", refreshRect, { passive: true });
    window.addEventListener("resize", refreshRect, { passive: true });

    const resizeObserver = new ResizeObserver(() => build());
    resizeObserver.observe(wrap);

    const themeObserver = new MutationObserver(() => {
      colorRef.current = readAccent();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    document.fonts?.ready?.then(() => {
      if (!cancelled) build();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(deferredBuild);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", refreshRect);
      window.removeEventListener("resize", refreshRect);
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [reduced, text]);

  if (reduced) {
    return <span className="text-accent">{text}</span>;
  }

  return (
    <span ref={wrapRef} className="relative inline-block align-baseline text-accent">
      {/* Sizes the box the canvas fills; hidden from everything. */}
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      {/* The real word for the accessible name. */}
      <span className="sr-only">{text}</span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </span>
  );
}
