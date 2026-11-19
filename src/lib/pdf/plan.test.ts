import { expect, test } from "bun:test";
import { pickQuality, pagePixels, imagePage, overhead } from "./plan";

test("pickQuality takes the best quality whose pages fit together", () => {
  // two pages, qualities best → worst
  const sizes = [[500, 300, 100], [400, 200, 100]];
  expect(pickQuality(sizes, 1000)).toBe(0); // 900 fits
  expect(pickQuality(sizes, 600)).toBe(1); // 500 fits
  expect(pickQuality(sizes, 250)).toBe(2);
  expect(pickQuality(sizes, 150)).toBe(-1);
});

test("pagePixels renders an A4 page at the asked DPI, capped on the long edge", () => {
  expect(pagePixels(595, 842, 72)).toEqual({ w: 595, h: 842 });
  expect(pagePixels(595, 842, 144)).toEqual({ w: 1190, h: 1684 });
  const big = pagePixels(595, 842, 600, 2000);
  expect(big.h).toBe(2000);
  expect(big.w).toBe(Math.round((595 * 2000) / 842));
});

test("imagePage puts a photo on a page whose long side is A4 height", () => {
  expect(imagePage(3000, 4000)).toEqual({ w: 631.5, h: 842 });
  expect(imagePage(4000, 3000)).toEqual({ w: 842, h: 631.5 });
});

test("overhead grows with page count", () => {
  expect(overhead(10)).toBeGreaterThan(overhead(1));
});
