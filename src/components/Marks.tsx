import { cn } from "@/lib/utils";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", pathLength: 24 } as const;

/** A ballpoint tick, drawn when a rule is met. */
export const Tick = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <svg viewBox="0 0 20 20" aria-hidden className={cn("size-5 text-pen", className)}>
    <path className="draw" style={{ animationDelay: `${delay}ms` }} d="M3.5 10.5l4.5 4.5 8.5-10.5" {...stroke} />
  </svg>
);

/** A red strike, drawn when a rule is broken. */
export const Strike = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <svg viewBox="0 0 20 20" aria-hidden className={cn("size-5 text-fail", className)}>
    <path className="draw" style={{ animationDelay: `${delay}ms` }} d="M5 5l10 10" {...stroke} />
    <path className="draw" style={{ animationDelay: `${delay + 120}ms` }} d="M15 5L5 15" {...stroke} />
  </svg>
);
