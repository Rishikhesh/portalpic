import { expect, test } from "bun:test";
import { frame, inkBounds } from "./trim";

// A w × h sheet of light paper with dark rectangles drawn on it.
function sheet(w: number, h: number, marks: [number, number, number, number][], paper = 235) {
  const px = new Uint8ClampedArray(w * h * 4).fill(paper);
  for (const [x0, y0, mw, mh] of marks) for (let y = y0; y < y0 + mh; y++) for (let x = x0; x < x0 + mw; x++) px.fill(20, (y * w + x) * 4, (y * w + x) * 4 + 3);
  return px;
}

test("inkBounds finds the signature on the page and ignores a speck of dust", () => {
  expect(inkBounds(sheet(100, 80, [[30, 40, 40, 10], [5, 5, 1, 1]]), 100, 80)).toEqual({ x: 30, y: 40, width: 40, height: 10 });
});

test("inkBounds gives up on a blank sheet, on grey paper with no ink, and on a mostly dark picture", () => {
  expect(inkBounds(sheet(50, 50, []), 50, 50)).toBeNull();
  expect(inkBounds(sheet(50, 50, [], 120), 50, 50)).toBeNull();
  expect(inkBounds(sheet(50, 50, [[0, 0, 50, 20]]), 50, 50)).toBeNull();
});

test("frame wraps the ink in the form's shape with a margin and stays inside the picture", () => {
  const f = frame({ x: 30, y: 40, width: 40, height: 10 }, 100, 80, 140 / 60);
  expect(f.width / f.height).toBeCloseTo(140 / 60);
  expect(f.width).toBeCloseTo(49.6); // 40 px of ink + 12% each side
  expect(f.x + f.width / 2).toBeCloseTo(50); // centred on the ink
  // Ink in a corner: the crop slides to stay on the picture.
  const corner = frame({ x: 0, y: 0, width: 20, height: 5 }, 100, 80, 2);
  expect(corner.x).toBe(0); expect(corner.y).toBe(0);
  // Ink bigger than any crop of that shape: the largest crop that fits.
  const big = frame({ x: 0, y: 0, width: 100, height: 80 }, 100, 80, 1);
  expect(big).toEqual({ x: 10, y: 0, width: 80, height: 80 });
});
