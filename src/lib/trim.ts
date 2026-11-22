// Finds the ink in a scan and the crop that frames it. No DOM, so it runs under `bun test`.

export type Box = { x: number; y: number; width: number; height: number };

/**
 * Bounding box of the dark marks on light paper (RGBA pixels), or null when there is no clear ink:
 * a blank sheet, or a picture that is mostly dark (a table top, a face photo).
 */
// ponytail: one global threshold against the paper's brightness. A dark table edge inside the picture widens the
// box (so less gets trimmed, never the ink); switch to connected components if that turns out to be common.
export function inkBounds(px: Uint8ClampedArray, w: number, h: number): Box | null {
  const n = w * h, lum = new Uint8Array(n), hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[(lum[i] = (77 * px[i * 4] + 150 * px[i * 4 + 1] + 29 * px[i * 4 + 2]) >> 8)]++;
  let paper = 255;
  for (let l = 0, seen = 0; l < 256; l++) if ((seen += hist[l]) >= n * 0.7) { paper = l; break; } // most of a scan is paper
  const cut = paper * 0.62;
  const rows = new Uint32Array(h), cols = new Uint32Array(w);
  let dark = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (lum[y * w + x] < cut) { rows[y]++; cols[x]++; dark++; }
  if (!dark || dark > n * 0.25) return null;
  // A lone dark pixel is dust, not ink: a row or column counts once it has two.
  const first = (a: Uint32Array) => a.findIndex((c) => c >= 2);
  const last = (a: Uint32Array) => { let i = a.length - 1; while (i > 0 && a[i] < 2) i--; return i; };
  const x0 = first(cols), y0 = first(rows);
  if (x0 < 0 || y0 < 0) return null;
  return { x: x0, y: y0, width: last(cols) - x0 + 1, height: last(rows) - y0 + 1 };
}

/** The crop of shape `aspect` (width ÷ height) that frames `ink` with a margin, kept inside an imgW × imgH picture. */
export function frame(ink: Box, imgW: number, imgH: number, aspect: number, margin = 0.12): Box {
  let width = ink.width * (1 + 2 * margin), height = ink.height * (1 + 2 * margin);
  if (width / height < aspect) width = height * aspect; else height = width / aspect;
  const k = Math.min(1, imgW / width, imgH / height); // never bigger than the picture
  width *= k; height *= k;
  const clamp = (v: number, hi: number) => Math.min(Math.max(v, 0), hi);
  return { x: clamp(ink.x + ink.width / 2 - width / 2, imgW - width), y: clamp(ink.y + ink.height / 2 - height / 2, imgH - height), width, height };
}
