// Guards against images that would exhaust memory when decoded (huge photos, decompression bombs).
// Pure helpers: no DOM, so they run under `bun test`.

export const MAX_FILE_BYTES = 60 * 1024 * 1024; // 60 MB
export const MAX_PIXELS = 64_000_000;           // ~64 MP: covers 50 MP phone cameras
export const WORK_EDGE = 4096;                  // long edge we decode down to; outputs never need more

// Read width/height from the file header without decoding pixels.
// Returns { w, h, type } or null when the format isn't recognised (HEIC, AVIF, …).
export type Dims = { w: number; h: number };

export function sniffDims(b: Uint8Array): (Dims & { type: "png" | "gif" | "bmp" | "webp" | "jpeg" }) | null {
  const u16be = (i: number) => (b[i] << 8) | b[i + 1];
  const u32be = (i: number) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const u16le = (i: number) => b[i] | (b[i + 1] << 8);
  const u24le = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  const ascii = (i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));
  if (b.length < 30) return null;

  if (b[0] === 0x89 && ascii(1, 3) === "PNG") return { w: u32be(16), h: u32be(20), type: "png" };
  if (ascii(0, 4) === "GIF8") return { w: u16le(6), h: u16le(8), type: "gif" };
  if (ascii(0, 2) === "BM") {
    const w = (b[18] | (b[19] << 8) | (b[20] << 16) | (b[21] << 24));
    const h = (b[22] | (b[23] << 8) | (b[24] << 16) | (b[25] << 24));
    return { w: Math.abs(w), h: Math.abs(h), type: "bmp" };
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const kind = ascii(12, 4);
    if (kind === "VP8X") return { w: u24le(24) + 1, h: u24le(27) + 1, type: "webp" };
    if (kind === "VP8L" && b[20] === 0x2f) {
      const v = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { w: (v & 0x3fff) + 1, h: ((v >>> 14) & 0x3fff) + 1, type: "webp" };
    }
    if (kind === "VP8 ") return { w: u16le(26) & 0x3fff, h: u16le(28) & 0x3fff, type: "webp" };
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      const isSof = m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
      if (isSof) return { w: u16be(i + 7), h: u16be(i + 5), type: "jpeg" };
      if (m === 0xd9 || m === 0xda) return null; // reached image data without a frame header
      i += 2 + u16be(i + 2);
    }
    return null;
  }
  return null;
}

// Why a file can't be opened, or null when it's safe to decode.
export function rejectReason(bytes: number, dims: Dims | null): string | null {
  if (bytes > MAX_FILE_BYTES) return `That file is ${Math.round(bytes / 1048576)} MB. Choose one under ${MAX_FILE_BYTES / 1048576} MB.`;
  if (dims && (dims.w <= 0 || dims.h <= 0)) return "That image looks damaged. Choose another file.";
  if (dims && dims.w * dims.h > MAX_PIXELS)
    return `That image is ${dims.w} × ${dims.h} pixels, too large to process safely here. Choose one under ${MAX_PIXELS / 1e6} megapixels.`;
  return null;
}

// Size to decode to: the long edge capped at WORK_EDGE, aspect kept.
export function workSize(w: number, h: number): Dims {
  const k = Math.min(1, WORK_EDGE / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}
