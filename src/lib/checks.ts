// What a person reviewing the photo would reject, which the portal's upload check never tests.
// No DOM, so it runs under `bun test`.

export type Issue = "dark" | "background" | "soft";

/** One plain sentence per issue: what looks wrong, and what to do. */
export const ISSUE_TEXT: Record<Issue, string> = {
  dark: "The photo looks dark. Use one taken in good light.",
  background: "The background may not be plain. Most portals want a plain, light wall.",
  soft: "This crop is small, so it may look blurry. Zoom out or use a larger photo.",
};

/** Checks the finished picture (RGBA): overall brightness, and the two top corners, where a portrait shows its background. */
// ponytail: fixed thresholds on brightness and spread, tuned to warn only on clear cases. They never block the download.
export function photoIssues(px: Uint8ClampedArray, w: number, h: number): Issue[] {
  const step = Math.max(1, Math.floor(Math.min(w, h) / 160)); // sampling keeps big pictures cheap
  const stats = (x0: number, x1: number, y0: number, y1: number) => {
    let n = 0, sum = 0, sq = 0;
    for (let y = Math.floor(y0); y < y1; y += step) for (let x = Math.floor(x0); x < x1; x += step) {
      const i = (y * w + x) * 4, l = (77 * px[i] + 150 * px[i + 1] + 29 * px[i + 2]) >> 8;
      n++; sum += l; sq += l * l;
    }
    const mean = sum / n;
    return { mean, spread: Math.sqrt(Math.max(0, sq / n - mean * mean)) };
  };
  if (stats(0, w, 0, h).mean < 80) return ["dark"]; // a dark photo has a dark wall too: one warning, not two
  const left = stats(0, w * 0.16, h * 0.04, h * 0.2), right = stats(w * 0.84, w, h * 0.04, h * 0.2);
  const busy = [left, right].some((c) => c.mean < 140 || c.spread > 26) || Math.abs(left.mean - right.mean) > 45;
  return busy ? ["background"] : [];
}
