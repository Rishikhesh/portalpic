import { expect, test } from "bun:test";
import { photoIssues } from "./checks";

// A 200 × 230 portrait: a wall of one brightness with a darker head-and-shoulders block in the middle.
function portrait(wall: (x: number, y: number) => number, face = 120) {
  const w = 200, h = 230, px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inFace = x > 60 && x < 140 && y > 50;
    px.fill(inFace ? face : wall(x, y), (y * w + x) * 4, (y * w + x) * 4 + 3);
  }
  return px;
}

test("a plain light wall raises nothing", () => {
  expect(photoIssues(portrait(() => 225), 200, 230)).toEqual([]);
});

test("a dark photo is reported once, as dark", () => {
  expect(photoIssues(portrait(() => 40, 30), 200, 230)).toEqual(["dark"]);
});

test("a patterned wall, a dark wall, and a wall lit from one side are reported as background", () => {
  expect(photoIssues(portrait((x, y) => ((x >> 3) + (y >> 3)) % 2 ? 230 : 120), 200, 230)).toEqual(["background"]); // curtains, shelves
  expect(photoIssues(portrait(() => 110, 200), 200, 230)).toEqual(["background"]);
  expect(photoIssues(portrait((x) => (x < 100 ? 240 : 170)), 200, 230)).toEqual(["background"]);
});
