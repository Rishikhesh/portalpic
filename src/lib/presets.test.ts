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
