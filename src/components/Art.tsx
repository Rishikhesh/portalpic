import { ImagePlus } from "lucide-react";
import { isInk, type Spec } from "@/lib/spec";
import { cn } from "@/lib/utils";

// Flat example pictures: what a good upload looks like. Drawn here, not photos of anyone.
const INK = "#141414", SKIN = "#c98d62", SHADE = "#b0764c", HAIR = "#211c1a";

/** A passport-style portrait: plain light background, face centred, shoulders square. */
export const Portrait = () => (
  <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className="block size-full">
    <rect width="300" height="300" fill="#dfe8f2" />
    <path d="M22 300c2-46 40-70 88-80l40 22 40-22c48 10 86 34 88 80z" fill="#2449b8" />
    <path d="M126 176v44c0 20 48 20 48 0v-44z" fill={SKIN} />
    <path d="M126 190c14 14 34 14 48 0v-14h-48z" fill={SHADE} />
    <path d="M110 220l40 34-22 14-30-40zM190 220l-40 34 22 14 30-40z" fill="#f7f6f1" />
    <ellipse cx="97" cy="132" rx="9" ry="15" fill={SHADE} />
    <ellipse cx="203" cy="132" rx="9" ry="15" fill={SHADE} />
    <path d="M100 112c0-50 100-50 100 0v24c0 38-28 62-50 62s-50-24-50-62z" fill={SKIN} />
    <path d="M95 122c-8-48 22-76 57-76 36 0 62 26 53 76-5-18-14-30-27-35-26 11-56 9-72 1-6 9-9 20-11 34z" fill={HAIR} />
    <path d="M115 119q12-6 24-1M161 118q12-5 24 1" fill="none" stroke={HAIR} strokeWidth="4.5" strokeLinecap="round" />
    <ellipse cx="127" cy="133" rx="5" ry="6" fill={HAIR} />
    <ellipse cx="173" cy="133" rx="5" ry="6" fill={HAIR} />
    <path d="M150 136l-4 20q4 4 9 1" fill="none" stroke={SHADE} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M135 172q15 10 30 0" fill="none" stroke="#7d3f2d" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/** A signature in dark ink on white paper. */
export const Sign = () => (
  <svg viewBox="0 0 240 100" className="block size-full">
    <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 64c8-30 26-44 32-24 5 18-16 38-8 18 10-24 26-24 30-6 3 12 14 8 20-4s16-8 14 6 12 10 20-4c6-10 16-8 14 4-1 8 10 8 20-2 14-14 30-8 44-12" />
      <path d="M44 84c50-8 110-6 164-10" strokeWidth="3" />
    </g>
  </svg>
);

/** A left-thumb impression: an inked oval of ridges. */
export const Thumb = () => (
  <svg viewBox="0 0 100 100" className="block size-full">
    <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
      <path d="M50 44c-4 0-6 4-6 10s2 14 2 20" />
      <path d="M38 78c-2-8-3-16-3-24 0-11 6-19 15-19s15 8 15 19c0 6-1 12-2 18" />
      <path d="M29 70c-2-6-3-12-3-18 0-16 10-27 24-27s24 11 24 27c0 9-2 18-5 26" />
      <path d="M21 58c-1-20 12-42 29-42 18 0 31 16 31 38 0 6-1 12-2 18" />
      <path d="M56 50c1 8 0 20-3 30" />
    </g>
  </svg>
);

/** A handwritten declaration: a few lines of writing. */
export const Declaration = () => (
  <svg viewBox="0 0 200 100" className="block size-full">
    <g fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round">
      {[[20, 172], [40, 180], [60, 164], [80, 112]].map(([y, end]) => (
        <path key={y} d={`M18 ${y}${Array.from({ length: Math.floor((end - 18) / 11) }, (_, i) => `q${i % 3 === 1 ? 4 : 5.5} ${i % 2 ? 7 : -7} 11 0`).join("")}`} />
      ))}
    </g>
  </svg>
);

/** Several pages joined into one file, for the PDF tool. */
export const Pages = () => (
  <svg viewBox="0 0 120 140" className="block size-full" aria-hidden>
    <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M34 12h62v100H34z" fill="#fff" />
      <path d="M22 26h62v100H22z" fill="#fff" />
    </g>
    <rect x="32" y="38" width="22" height="26" fill="#dfe8f2" stroke={INK} strokeWidth="2" />
    <g fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round">
      <path d="M62 42h14M62 52h14M62 62h10M32 78h44M32 90h44M32 102h30" />
    </g>
    <path d="M70 110l8 8 16-19" fill="none" stroke="#1a3fb5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The example for one upload, framed at that upload's real shape so a signature strip never looks like a photo. */
export function Example({ spec, maxW, maxH, className }: { spec: Pick<Spec, "id" | "label" | "w" | "h">; maxW: number; maxH: number; className?: string }) {
  const ar = spec.w / spec.h, h = Math.min(maxH, maxW / ar);
  const Art = spec.id === "custom" ? null : /thumb/i.test(spec.label) ? Thumb : /declaration/i.test(spec.label) ? Declaration : isInk(spec as Spec) ? Sign : Portrait;
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center overflow-hidden border border-line-strong bg-white text-muted-foreground", !Art && "border-dashed", className)}
      style={{ width: h * ar, height: h }}>
      {Art ? <Art /> : <ImagePlus className="size-1/3 max-h-7 max-w-7" strokeWidth={1.6} />}
    </span>
  );
}
