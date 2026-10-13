import type { ReactNode } from "react";

/** Illustrated empty state with an optional call to action. */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <svg viewBox="0 0 120 90" className="h-24 w-32" aria-hidden>
        <ellipse cx="60" cy="80" rx="40" ry="5" className="fill-muted" />
        <rect x="28" y="18" width="64" height="52" rx="10" className="fill-secondary stroke-border" strokeWidth="1.5" />
        <rect x="38" y="32" width="30" height="5" rx="2.5" className="fill-muted-foreground/40" />
        <rect x="38" y="43" width="44" height="5" rx="2.5" className="fill-muted-foreground/25" />
        <circle cx="88" cy="20" r="11" className="fill-primary" />
        <path d="M84 20l3 3 5-6" className="stroke-primary-foreground" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-3 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
