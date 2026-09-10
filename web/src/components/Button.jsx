// The hover fill lives on a decorative child `<span>`, never on the `<a>`
// itself. GSAP leaves an inline `transform` on anything a timeline
// animates, and an inline style always beats a stylesheet `:hover` rule —
// so a hover transform on an element the intro animates would simply never
// fire, with no error and no warning.
export default function Button({ href, variant = "primary", className = "", children, ...props }) {
  const isGhost = variant === "ghost";

  return (
    <a
      href={href}
      className={`group relative inline-flex items-center overflow-hidden rounded-xl px-6 py-3 active:scale-[0.97] transition-transform duration-200 ${
        isGhost ? "border border-line" : ""
      } ${className}`}
      {...props}
    >
      <span aria-hidden className={`absolute inset-0 ${isGhost ? "bg-transparent" : "bg-surface-2"}`} />
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-[220ms] ease-entrance group-hover:scale-x-100"
      />
      {/* On a primary button the accent fill wipes in behind the label, and
          `text-text` on `bg-accent` only clears ~3.4:1 — below AA. Flip the
          label to `text-bg` (the same pairing the skip link uses) once the
          fill has arrived: the colour swap is delayed ~220ms so it lands
          after the wipe, not mid-sweep. Ghost buttons have no fill, so they
          keep the inherited colour. */}
      <span
        className={`relative transition-colors delay-200 duration-150 ${
          isGhost ? "" : "group-hover:text-bg"
        }`}
      >
        {children}
      </span>
    </a>
  );
}
