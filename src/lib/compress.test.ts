import { test, expect } from "bun:test";
import { fitQuality, padJpeg, setJpegDpi, maxBytes, minBytes } from "./compress";

const jfif = () => {
  const b = new Uint8Array(40);
  b.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1]);
  b[38] = 0xff; b[39] = 0xd9;
  return b;
};

test("fitQuality picks the highest quality under the limit", async () => {
  const enc = async (q: number) => new Uint8Array(Math.round(q * 1000)); // size grows with quality
  const r = await fitQuality(enc, 500);
  expect(r!.bytes.length).toBeLessThanOrEqual(500);
  expect(r!.bytes.length).toBeGreaterThan(490);
});

test("fitQuality returns null when nothing fits", async () => {
  expect(await fitQuality(async () => new Uint8Array(999), 10)).toBeNull();
});

test("padJpeg reaches the target, keeps SOI first and the original tail", () => {
  const src = jfif();
  for (const target of [41, 44, 45, 5000, 200000]) {
    const out = padJpeg(src, target);
    expect(out.length).toBeGreaterThanOrEqual(target);
    expect(out.length).toBeLessThan(target + 8);
    expect([out[0], out[1], out[2], out[3]]).toEqual([0xff, 0xd8, 0xff, 0xfe]);
    expect(out.subarray(out.length - 38)).toEqual(src.subarray(2));
  }
});

test("padJpeg segment lengths are valid", () => {
  const out = padJpeg(jfif(), 140000);
  let i = 2;
  while (out[i] === 0xff && out[i + 1] === 0xfe) {
    const len = (out[i + 2] << 8) | out[i + 3];
    expect(len).toBeGreaterThanOrEqual(3);
    expect(len).toBeLessThanOrEqual(65535);
    i += 2 + len;
  }
  expect([out[i], out[i + 1]]).toEqual([0xff, 0xe0]); // lands exactly on original APP0
});

test("setJpegDpi writes density", () => {
  const out = setJpegDpi(jfif(), 200);
  expect([out[13], (out[14] << 8) | out[15], (out[16] << 8) | out[17]]).toEqual([1, 200, 200]);
});

test("KB limits use the strict interpretation", () => {
  expect(maxBytes(50)).toBe(50000);
  expect(minBytes(20)).toBe(20480);
});
