import { test, expect } from "bun:test";
import { PRESETS } from "./presets";

// Guards hand edits to the preset list: these mistakes would ship a file no portal accepts.
test("every preset is well-formed", () => {
  const ids = new Set<string>();
  for (const p of PRESETS) {
    expect(ids.has(p.id)).toBe(false); ids.add(p.id);
    expect(p.source).toMatch(/^https:\/\//);
    expect(p.w).toBeGreaterThanOrEqual(16); expect(p.h).toBeGreaterThanOrEqual(16);
    expect(Math.max(p.w, p.h)).toBeLessThanOrEqual(4096);
    expect(p.maxKB).toBeGreaterThan(0);
    expect(p.minKB).toBeLessThan(p.maxKB);
  }
});

test("kits and face guides", async () => {
  const { kitFor, faceGuide, presets, DEFAULT_FACE } = await import("./spec");
  const by = (id: string) => presets.find((p) => p.id === id)!;
  expect(kitFor(by("ibps-photo")).map((p) => p.id)).toEqual(["ibps-photo", "ibps-signature", "ibps-thumb", "ibps-declaration"]);
  expect(kitFor(by("ssc-signature"))).toEqual([]); // a single upload is not a kit
  expect(faceGuide(by("ibps-signature"))).toBeNull(); // no face on a signature
  expect(faceGuide(by("ca-passport-online"))).toBe(0.475); // official 45–50%
  expect(faceGuide(by("ibps-photo"))).toBe(DEFAULT_FACE);
  for (const p of presets.filter((x) => x.faceHeight)) { expect(p.faceHeight!).toBeGreaterThan(0.3); expect(p.faceHeight!).toBeLessThan(0.95); }
});
