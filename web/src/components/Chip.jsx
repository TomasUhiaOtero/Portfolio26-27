// The one place `rounded-full` is allowed in this project — chips and
// indicator dots are pills by design, everything else (cards, buttons,
// containers) uses a 12–28px radius instead.
export default function Chip({ className = "", children, ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line px-3 py-1 text-xs text-mute ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
