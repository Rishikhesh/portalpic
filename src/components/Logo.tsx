// Drawn in the page's own ink and paper, so it flips with the light and dark looks.
export function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 shrink-0">
      <rect x="1" y="1" width="22" height="22" rx="3" fill="var(--foreground)" />
      <path d="M7 6.5h-.5v3M17 6.5h.5v3M7 17.5h-.5v-3M17 17.5h.5v-3" stroke="var(--canvas)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="10.6" r="2" fill="var(--canvas)" />
      <path d="M8.6 16.4c.6-1.8 1.9-2.7 3.4-2.7s2.8.9 3.4 2.7" fill="var(--canvas)" />
    </svg>
  );
}
