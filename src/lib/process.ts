import { fitQuality, padJpeg, setJpegDpi, maxBytes, minBytes } from "./compress";
import type { Spec } from "./spec";
import { sniffDims, rejectReason, workSize } from "./limits";
import { frame, inkBounds } from "./trim";
import { photoIssues, type Issue } from "./checks";

export class LoadError extends Error {}

// Ask the browser for dimensions without decoding pixels (for formats we can't sniff, e.g. HEIC on Safari).
function probe(url: string) {
  return new Promise<{ w: number; h: number } | null>((res) => {
    const im = new Image();
    const t = setTimeout(() => res(null), 10000);
    im.onload = () => { clearTimeout(t); res({ w: im.naturalWidth, h: im.naturalHeight }); };
    im.onerror = () => { clearTimeout(t); res(null); };
    im.src = url;
  });
}

// Open a user file safely: refuse oversized files and decompression bombs before decoding,
// then keep only a working copy capped at WORK_EDGE so later steps stay light on memory.
export async function loadImage(file: File): Promise<{ bitmap: ImageBitmap; url: string }> {
  const early = rejectReason(file.size, null);
  if (early) throw new LoadError(early);
  const head = new Uint8Array(await file.slice(0, 512 * 1024).arrayBuffer());
  const fileUrl = URL.createObjectURL(file);
  let dims: { w: number; h: number } | null = sniffDims(head);
  if (!dims) dims = await probe(fileUrl);
  const why = dims ? rejectReason(file.size, dims) : "This browser can't open that file. Choose a JPG or PNG (on iPhone, pick it from Photos).";
  if (why) { URL.revokeObjectURL(fileUrl); throw new LoadError(why); }

  let full: ImageBitmap;
  try { full = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { URL.revokeObjectURL(fileUrl); throw new LoadError("This browser can't open that file. Choose a JPG or PNG (on iPhone, pick it from Photos)."); }

  const size = workSize(full.width, full.height);
  if (size.w === full.width && size.h === full.height) return { bitmap: full, url: fileUrl };

  URL.revokeObjectURL(fileUrl);
  const c = document.createElement("canvas");
  c.width = size.w; c.height = size.h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, size.w, size.h);
  g.imageSmoothingQuality = "high";
  g.drawImage(full, 0, 0, size.w, size.h);
  full.close();
  const bitmap = await createImageBitmap(c);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.92));
  c.width = c.height = 0; // release the canvas backing store now
  if (!blob) { bitmap.close(); throw new LoadError("Couldn't prepare that image. Try another file."); }
  return { bitmap, url: URL.createObjectURL(blob) };
}

export type Area = { x: number; y: number; width: number; height: number };

export type Result = {
  url: string;
  bytes: number;
  quality: number;
  w: number;
  h: number;
  padded: boolean;
  fits: boolean;
  tooBig: boolean;
  /** Things a human reviewer may reject (dark, busy background, soft). Never blocks the download. */
  issues: Issue[];
};

/** The crop that frames the ink in a signature, thumbprint or declaration scan, or null when trimming wouldn't help. */
export function inkArea(img: ImageBitmap, aspect: number): Area | null {
  const k = Math.min(1, 320 / Math.max(img.width, img.height)); // a small copy is plenty to find ink
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  const ink = inkBounds(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
  const sx = img.width / c.width, sy = img.height / c.height;
  c.width = c.height = 0;
  if (!ink) return null;
  const a = frame({ x: ink.x * sx, y: ink.y * sy, width: ink.width * sx, height: ink.height * sy }, img.width, img.height, aspect);
  // Already filling the picture: leave the default view alone.
  return a.width > Math.min(img.width, img.height * aspect) * 0.92 ? null : a;
}

// One cached rotation at a time: a rotated 4096px copy is ~64 MB, so never hold more than one.
let rotCache: { img: ImageBitmap; rot: number; c: HTMLCanvasElement } | null = null;

// Rotated copy of the source in react-easy-crop's coordinate space (the rotated bounding box).
function rotated(img: ImageBitmap, rot: number): CanvasImageSource {
  if (!rot) return img;
  if (rotCache?.img === img && rotCache.rot === rot) return rotCache.c;
  if (rotCache) rotCache.c.width = rotCache.c.height = 0; // free the previous copy
  const c = document.createElement("canvas");
  const swap = rot % 180 !== 0;
  c.width = swap ? img.height : img.width;
  c.height = swap ? img.width : img.height;
  const g = c.getContext("2d")!;
  g.translate(c.width / 2, c.height / 2);
  g.rotate((rot * Math.PI) / 180);
  g.drawImage(img, -img.width / 2, -img.height / 2);
  rotCache = { img, rot, c };
  return c;
}

// Push near-white paper to pure white and deepen ink, so signatures read crisply and compress cleanly.
function whiten(g: CanvasRenderingContext2D, W: number, H: number) {
  const d = g.getImageData(0, 0, W, H), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const l = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
    if (l > 165) a[i] = a[i + 1] = a[i + 2] = 255;
    else { const k = l / 165; a[i] *= k; a[i + 1] *= k; a[i + 2] *= k; }
  }
  g.putImageData(d, 0, 0);
}

function draw(c: HTMLCanvasElement, src: CanvasImageSource, area: Area, W: number, H: number, clean: boolean) {
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: clean })!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); // flatten transparency to white
  g.imageSmoothingQuality = "high";
  g.drawImage(src, area.x, area.y, area.width, area.height, 0, 0, W, H);
  if (clean) whiten(g, W, H);
}

const encoder = (c: HTMLCanvasElement) => (q: number) =>
  new Promise<Uint8Array>((res, rej) =>
    c.toBlob(async (b) => (b ? res(new Uint8Array(await b.arrayBuffer())) : rej(new Error("encode failed"))), "image/jpeg", q));

// targetKB (optional) aims the file at a size inside the allowed range; the result lands at or just under it.
export class Stale extends Error {}

// `check` runs the reviewer checks (face photos only).
export async function processImage(img: ImageBitmap, rot: number, area: Area, spec: Spec, clean: boolean, targetKB: number | null = null, isStale: () => boolean = () => false, check = false): Promise<Result> {
  const max = maxBytes(spec.maxKB), min = spec.minKB ? minBytes(spec.minKB) : 0;
  const cap = targetKB ? Math.max(min, Math.min(max, Math.floor(targetKB * 1024))) : max;
  const c = document.createElement("canvas");
  draw(c, rotated(img, rot), area, spec.w, spec.h, clean);
  const issues: Issue[] = check ? photoIssues(c.getContext("2d")!.getImageData(0, 0, spec.w, spec.h).data, spec.w, spec.h) : [];
  if (check && area.width < spec.w * 0.75) issues.push("soft"); // the crop holds fewer pixels than the file needs
  const base = encoder(c);
  // Bail out between encodes once a newer edit supersedes this run, so drags don't pile up work.
  const enc = async (q: number) => { if (isStale()) throw new Stale(); return base(q); };
  let r = await fitQuality(enc, cap);
  // Nothing fits: report how small the picture could get, so the page can say by how much it missed.
  if (!r) return { url: "", bytes: (await enc(0.05)).length, quality: 0, w: spec.w, h: spec.h, padded: false, fits: false, tooBig: true, issues };

  let bytes: Uint8Array = r.bytes, padded = false;
  if (min && bytes.length < min) { // too small: spend the headroom on real quality before padding
    const best = await enc(1);
    if (best.length <= cap) r = { bytes: (bytes = best), quality: 1 };
  }
  if (min && bytes.length < min && min < max) { bytes = padJpeg(bytes, Math.min(cap, min + 512)); padded = true; }
  if (spec.dpi) bytes = setJpegDpi(bytes, spec.dpi);

  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/jpeg" }));
  return { url, bytes: bytes.length, quality: r.quality, w: spec.w, h: spec.h, padded, fits: bytes.length >= min && bytes.length <= max, tooBig: false, issues };
}
