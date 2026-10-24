const M_PATH = "M184 95h32v263h-32V178l-32 88-30-61v107l-32-32V172l32-32 28 58z";
const L_PATH = "M244 95h34v223l78-78v35l-83 83h-29z";

/** The ML monogram in a ring. Inherits `currentColor`; size it with `size-*` utilities. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="17 23 409 409" aria-hidden="true" focusable="false" className={className}>
      <path d={M_PATH} fill="currentColor" />
      <path d={L_PATH} fill="currentColor" />
      <circle cx="221.5" cy="227.5" r="197" fill="none" stroke="currentColor" strokeWidth="15" />
    </svg>
  );
}
