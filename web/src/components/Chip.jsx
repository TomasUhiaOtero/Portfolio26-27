// The one place `rounded-full` is allowed in this project — chips and
// indicator dots are pills by design, everything else (cards, buttons,
// containers) uses a 12–28px radius instead.
//
// Filled, full-contrast pill: the tech/stack chips are content, not a
// footnote, so they read at the same weight as body text everywhere they
// appear (About groups, Experience, Services, the project overlay).
export default function Chip({ className = "", children, ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-text/15 bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-text shadow-sm ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
