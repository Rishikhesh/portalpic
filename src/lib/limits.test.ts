import { test, expect } from "bun:test";
import { sniffDims, rejectReason, workSize, MAX_FILE_BYTES } from "./limits";

const buf = (n: number) => new Uint8Array(n);

test("PNG header", () => {
  const b = buf(40); b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  b.set([0, 0, 0x75, 0x30, 0, 0, 0x75, 0x30], 16); // 30000 × 30000
  expect(sniffDims(b)).toEqual({ w: 30000, h: 30000, type: "png" });
});

test("JPEG: skips APP segments, reads SOF2 (progressive)", () => {
  const b = buf(64);
  b.set([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10], 0); // APP1, 16 bytes
  b.set([0xff, 0xc2, 0x00, 0x11, 0x08, 0x0b, 0xb8, 0x0f, 0xa0], 20); // h=3000 w=4000
  expect(sniffDims(b)).toEqual({ w: 4000, h: 3000, type: "jpeg" });
});

test("GIF, BMP, WebP variants", () => {
  const gif = buf(32); gif.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x40, 0x01, 0xf0, 0x00]);
  expect(sniffDims(gif)).toEqual({ w: 320, h: 240, type: "gif" });

  const bmp = buf(32); bmp.set([0x42, 0x4d]); bmp.set([0x00, 0x04, 0, 0], 18); bmp.set([0x00, 0xfd, 0xff, 0xff], 22); // 1024 × -768
  expect(sniffDims(bmp)).toEqual({ w: 1024, h: 768, type: "bmp" });

  const riff = (kind: string) => { const b = buf(40); b.set([..."RIFF"].map((c) => c.charCodeAt(0))); b.set([..."WEBP"].map((c) => c.charCodeAt(0)), 8); b.set([...kind].map((c) => c.charCodeAt(0)), 12); return b; };
  const x = riff("VP8X"); x.set([0x9f, 0x0f, 0x00], 24); x.set([0xb7, 0x0b, 0x00], 27); // 4000 × 3000
  expect(sniffDims(x)).toEqual({ w: 4000, h: 3000, type: "webp" });
  const l = riff("VP8L"); l[20] = 0x2f; const v = (99) | (49 << 14); l.set([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255], 21);
  expect(sniffDims(l)).toEqual({ w: 100, h: 50, type: "webp" });
  const lossy = riff("VP8 "); lossy.set([0x80, 0x02, 0xe0, 0x01], 26); // 640 × 480
  expect(sniffDims(lossy)).toEqual({ w: 640, h: 480, type: "webp" });
});

test("unknown or truncated formats return null", () => {
  expect(sniffDims(buf(10))).toBeNull();
  expect(sniffDims(buf(64))).toBeNull(); // e.g. HEIC/AVIF fall back to the browser's own probe
});

test("limits", () => {
  expect(rejectReason(MAX_FILE_BYTES + 1, null)).toContain("MB");
  expect(rejectReason(1000, { w: 16000, h: 16000 })).toContain("megapixels");
  expect(rejectReason(1000, { w: 0, h: 10 })).toContain("damaged");
  expect(rejectReason(1000, { w: 8160, h: 6144 })).toBeNull(); // 50 MP phone photo is fine
  expect(workSize(8000, 6000)).toEqual({ w: 4096, h: 3072 });
  expect(workSize(800, 600)).toEqual({ w: 800, h: 600 });
});
