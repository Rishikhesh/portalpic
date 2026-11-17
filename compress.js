// Pure helpers: no DOM, so they run under `bun test`.

// Portals disagree on whether 1 KB is 1000 or 1024 bytes, so pick the strict side of each limit.
export const maxBytes = (kb) => Math.floor(kb * 1000);
export const minBytes = (kb) => Math.ceil(kb * 1024);

// Find the highest JPEG quality whose output fits under `max` bytes.
// `encode(q)` resolves to a Uint8Array. Returns { bytes, quality } or null if even the lowest quality is too big.
export async function fitQuality(encode, max, lo = 0.05, hi = 0.95, steps = 8) {
  let best = null;
  const top = await encode(hi);
  if (top.length <= max) return { bytes: top, quality: hi };
  for (let i = 0; i < steps; i++) {
    const q = (lo + hi) / 2;
    const b = await encode(q);
    if (b.length <= max) { best = { bytes: b, quality: q }; lo = q; } else hi = q;
  }
  if (!best) {
    const b = await encode(0.05);
    if (b.length <= max) best = { bytes: b, quality: 0.05 };
  }
  return best;
}

// Grow a JPEG to at least `target` bytes by inserting comment (COM) segments right after SOI.
// Pixels are untouched; portals that enforce a minimum file size only check the byte count.
export function padJpeg(bytes, target) {
  if (bytes.length >= target) return bytes;
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("not a JPEG");
  let need = target - bytes.length;
  const segs = [];
  while (need > 0) {
    const data = Math.min(65533, Math.max(1, need - 4)); // segment = 4 header bytes + data
    const seg = new Uint8Array(4 + data).fill(0x20);
    seg[0] = 0xff; seg[1] = 0xfe; seg[2] = (data + 2) >> 8; seg[3] = (data + 2) & 0xff;
    segs.push(seg);
    need -= seg.length;
  }
  const out = new Uint8Array(bytes.length + segs.reduce((n, s) => n + s.length, 0));
  out.set(bytes.subarray(0, 2), 0);
  let o = 2;
  for (const s of segs) { out.set(s, o); o += s.length; }
  out.set(bytes.subarray(2), o);
  return out;
}

// Write DPI into the JFIF APP0 header if the encoder emitted one (Chrome/Firefox/Safari do).
export function setJpegDpi(bytes, dpi) {
  const isJfif = bytes[2] === 0xff && bytes[3] === 0xe0 &&
    String.fromCharCode(...bytes.subarray(6, 11)) === "JFIF\0";
  if (!isJfif) return bytes;
  const out = bytes.slice();
  out[13] = 1; // units: dots per inch
  out[14] = dpi >> 8; out[15] = dpi & 0xff;
  out[16] = dpi >> 8; out[17] = dpi & 0xff;
  return out;
}
