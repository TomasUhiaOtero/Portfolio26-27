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
        className="absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />
      <span className="relative">{children}</span>
    </a>
  );
}
