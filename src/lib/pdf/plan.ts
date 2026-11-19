// Pure sizing rules for the PDF tool: no DOM, so they run under `bun test`.

/** JPEG qualities tried for every page, best first. */
export const QUALITIES = [0.9, 0.8, 0.7, 0.6, 0.5, 0.42, 0.34, 0.26, 0.18, 0.12];
/** Page resolutions tried, sharpest first. 150 DPI reads like the paper; 60 is the floor for legible text. */
export const DPIS = [150, 120, 96, 72, 60];
/** Below this JPEG quality, a lower resolution reads better, down to SHARP_DPI. */
export const SHARP_Q = 0.4;
export const SHARP_DPI = 96;

/** Index of the best quality at which all pages together fit in `budget` bytes, or -1. sizes[page][quality]. */
export function pickQuality(sizes: number[][], budget: number): number {
  for (let q = 0; q < (sizes[0]?.length ?? 0); q++) {
    if (sizes.reduce((n, p) => n + p[q], 0) <= budget) return q;
  }
  return -1;
}

/** Pixel size for rendering a page of wPt × hPt points at `dpi`, long edge capped to keep phones' memory safe. */
export function pagePixels(wPt: number, hPt: number, dpi: number, cap = 2400) {
  const s = Math.min(dpi / 72, cap / Math.max(wPt, hPt));
  return { w: Math.round(wPt * s), h: Math.round(hPt * s) };
}

/** Page size in points for a photo: same shape as the photo, long side the height of A4. */
export function imagePage(wPx: number, hPx: number) {
  const s = 842 / Math.max(wPx, hPx);
  return { w: +(wPx * s).toFixed(1), h: +(hPx * s).toFixed(1) };
}

/** Bytes the PDF structure adds around the page images. */
export const overhead = (pages: number) => 4096 + 700 * pages;
