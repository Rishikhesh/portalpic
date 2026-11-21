// Browser side of the PDF tool: open files, draw pages onto a canvas, and rebuild a PDF that fits a size limit.
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { loadImage } from "@/lib/process";
import { PDFDocument } from "pdf-lib";
import { BadPdf, finish, fromJpegs, mergeKeep, type Part } from "./build";
import { STEPS, findImages, inflate, replaceImage, toRGBA, unpredict, type Img } from "./images";
import { DPIS, QUALITIES, SHARP_DPI, SHARP_Q, imagePage, overhead, pagePixels, pickQuality } from "./plan";

GlobalWorkerOptions.workerSrc = workerUrl;

export type Source =
  | { id: string; name: string; size: number; kind: "pdf"; file: File; pages: number; thumb: string; doc: PDFDocumentProxy }
  | { id: string; name: string; size: number; kind: "pdf-locked"; file: File; pages: 0; thumb: null; wrong: boolean }
  | { id: string; name: string; size: number; kind: "image"; file: File; pages: 1; thumb: string; bitmap: ImageBitmap };

export class OpenError extends Error {}
export class Stale extends Error {}

const MAX_PDF = 100 * 1024 * 1024;
let n = 0;

/** Open a dropped file. A password-locked PDF comes back as "pdf-locked" until `password` is given. */
export async function openSource(file: File, password?: string): Promise<Source> {
  const id = `s${++n}`, base = { id, name: file.name, size: file.size, file };
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (isPdf) {
    if (file.size > MAX_PDF) throw new OpenError(`${file.name} is over 100 MB.`);
    const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()), password, wasmUrl: "/pdfjs/wasm/", standardFontDataUrl: "/pdfjs/standard_fonts/" });
    try {
      const doc = await task.promise;
      return { ...base, kind: "pdf", pages: doc.numPages, doc, thumb: await thumb((c) => drawPdf(doc, 1, c, 40)) };
    } catch (e) {
      await task.destroy();
      if ((e as Error).name === "PasswordException") return { ...base, kind: "pdf-locked", pages: 0, thumb: null, wrong: !!password };
      throw new OpenError(`${file.name} can't be read as a PDF.`);
    }
  }
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) throw new OpenError(`${file.name} isn't a PDF or an image.`);
  const { bitmap, url } = await loadImage(file); // same size and decompression-bomb checks as the photo tool
  URL.revokeObjectURL(url);
  return { ...base, kind: "image", pages: 1, bitmap, thumb: await thumb((c) => drawImage(bitmap, c, 40)) };
}

export function closeSource(s: Source) {
  if (s.thumb) URL.revokeObjectURL(s.thumb);
  if (s.kind === "pdf") void s.doc.loadingTask.destroy();
  if (s.kind === "image") s.bitmap.close();
}

async function thumb(draw: (c: HTMLCanvasElement) => Promise<unknown>) {
  const c = document.createElement("canvas");
  await draw(c);
  const b = await blob(c, 0.8);
  c.width = c.height = 0;
  return URL.createObjectURL(b);
}

/** Draw page `no` (1-based) at `dpi`; returns its size in points. */
async function drawPdf(doc: PDFDocumentProxy, no: number, c: HTMLCanvasElement, dpi: number) {
  const page = await doc.getPage(no);
  const pt = page.getViewport({ scale: 1 });
  const px = pagePixels(pt.width, pt.height, dpi);
  c.width = px.w; c.height = px.h;
  await page.render({ canvas: c, viewport: page.getViewport({ scale: px.w / pt.width }), background: "#ffffff" }).promise;
  page.cleanup();
  return { w: pt.width, h: pt.height };
}

async function drawImage(b: ImageBitmap, c: HTMLCanvasElement, dpi: number) {
  const pt = imagePage(b.width, b.height);
  const px = pagePixels(pt.w, pt.h, dpi);
  c.width = Math.min(px.w, b.width); c.height = Math.min(px.h, b.height);
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.imageSmoothingQuality = "high";
  g.drawImage(b, 0, 0, c.width, c.height);
  return pt;
}

const blob = (c: HTMLCanvasElement, q: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), "image/jpeg", q));
const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

export type Built = {
  bytes: Uint8Array;
  /** kept: original pages untouched. shrunk: original pages, pictures recompressed. rebuilt: every page is now an image. */
  mode: "kept" | "shrunk" | "rebuilt";
  dpi?: number; quality?: number; edge?: number;
  /** Some locked or damaged files had to be redrawn as images. */
  forced: boolean;
};
type Hooks = { progress: (text: string) => void; stale: () => boolean };
type PdfSource = Extract<Source, { kind: "pdf" }>;

/**
 * Build one PDF from the sources, under `budget` bytes (Infinity for no limit), keeping it a real PDF whenever possible:
 * 1. merge the original pages (only files pdf-lib can't open are redrawn);
 * 2. if too big, recompress the pictures inside, leaving text, links and highlights alone;
 * 3. only then, or when `rebuild` is on, redraw every page as an image. Returns null if nothing fits.
 */
export async function build(sources: Source[], budget: number, rebuild: boolean, h: Hooks): Promise<Built | null> {
  if (!rebuild) {
    try {
      const redraw = new Set<number>();
      let kept: Uint8Array | undefined;
      while (!kept) {
        try { kept = await mergeKeep(await partsOf(sources, redraw, h)); }
        catch (e) { if (e instanceof BadPdf && !redraw.has(e.index)) redraw.add(e.index); else throw e; }
      }
      const forced = redraw.size > 0;
      if (kept.length <= budget) return { bytes: kept, mode: "kept", forced };
      const s = await shrink(kept, budget, h);
      if (s) return { ...s, forced };
    } catch (e) { if (e instanceof Stale) throw e; } // anything odd: the full redraw below still works
  }
  return rasterise(sources, budget, h);
}

async function partsOf(sources: Source[], redraw: Set<number>, h: Hooks): Promise<Part[]> {
  const parts: Part[] = [];
  const c = document.createElement("canvas");
  try {
    for (const [i, s] of sources.entries()) {
      if (s.kind === "pdf-locked") throw new Error("locked");
      if (s.kind === "pdf" && !redraw.has(i)) { parts.push({ kind: "pdf", bytes: await bytes(s.file) }); continue; }
      if (s.kind === "image") {
        await drawImage(s.bitmap, c, 300);
        parts.push({ kind: "jpg", bytes: await bytes(await blob(c, 0.9)), w: c.width, h: c.height });
        continue;
      }
      // Locked (opened with its password) or damaged: pdf.js can still draw it, so redraw only this file's pages.
      for (let no = 1; no <= s.pages; no++) {
        if (h.stale()) throw new Stale();
        h.progress(`Redrawing ${s.name}, page ${no} of ${s.pages}`);
        const pt = await drawPdf((s as PdfSource).doc, no, c, 200);
        parts.push({ kind: "jpg", bytes: await bytes(await blob(c, 0.85)), w: c.width, h: c.height, pt });
      }
    }
    h.progress("Merging…");
    return parts;
  } finally { c.width = c.height = 0; }
}

async function decode(img: Img): Promise<ImageBitmap> {
  if (img.filter === "jpeg") return createImageBitmap(new Blob([img.bytes as BlobPart], { type: "image/jpeg" }));
  let px = await inflate(img.bytes);
  if (img.predictor) px = unpredict(px, img.w, img.comps);
  return createImageBitmap(new ImageData(toRGBA(px, img.w, img.h, img.comps), img.w, img.h));
}

/** Step 2: same pages, same text; each picture redrawn smaller as a JPEG, all at one STEPS level. */
async function shrink(kept: Uint8Array, budget: number, h: Hooks): Promise<Built | null> {
  if (budget === Infinity) return null;
  const imgs = findImages(await PDFDocument.load(kept, { updateMetadata: false }));
  if (!imgs.length) return null;
  const fixed = kept.length - imgs.reduce((n, i) => n + i.bytes.length, 0);
  if (fixed > budget) return null; // the text and drawings alone are over the limit
  const ladders: ({ jpeg: Blob; w: number; h: number } | null)[][] = [], sizes: number[][] = [];
  const c = document.createElement("canvas");
  let floor = fixed;
  try {
    for (const [i, img] of imgs.entries()) {
      if (h.stale()) throw new Stale();
      h.progress(`Compressing picture ${i + 1} of ${imgs.length}`);
      const bmp = await decode(img).catch(() => null); // a picture we can't decode is kept as it is
      const ladder: (typeof ladders)[number] = [];
      for (const st of STEPS) {
        if (!bmp) { ladder.push(null); continue; }
        // ponytail: caps the picture's own pixels, not its size on the page; read the page's CTM if small inset photos come out soft.
        const k = Math.min(1, st.edge / Math.max(bmp.width, bmp.height));
        c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
        const g = c.getContext("2d")!;
        g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); // JPEG has no alpha; any transparency stays in the PDF's own mask
        g.imageSmoothingQuality = "high";
        g.drawImage(bmp, 0, 0, c.width, c.height);
        const b = await blob(c, st.q);
        ladder.push(b.size < img.bytes.length ? { jpeg: b, w: c.width, h: c.height } : null);
      }
      bmp?.close();
      ladders.push(ladder); sizes.push(ladder.map((x) => x?.jpeg.size ?? img.bytes.length));
      floor += sizes[i][STEPS.length - 1];
      if (floor > budget) return null; // even the smallest pictures won't fit
    }
    for (let k = Math.max(0, pickQuality(sizes, budget - fixed)); k < STEPS.length; k++) {
      h.progress("Assembling…");
      const doc = await PDFDocument.load(kept, { updateMetadata: false });
      for (const [i, img] of imgs.entries()) {
        const x = ladders[i][k];
        if (x) replaceImage(doc, img.ref, await bytes(x.jpeg), x.w, x.h);
      }
      const out = await finish(doc);
      if (out.length <= budget) return { bytes: out, mode: "shrunk", edge: STEPS[k].edge, quality: STEPS[k].q, forced: false };
    }
    return null;
  } finally { c.width = c.height = 0; }
}

/** Step 3: every page drawn as a JPEG, at the sharpest resolution and quality that fits. */
async function rasterise(sources: Source[], budget: number, h: Hooks): Promise<Built | null> {
  const pages = sources.flatMap((s) => Array.from({ length: s.pages }, (_, i) => ({ s, no: i + 1 })));
  const c = document.createElement("canvas");
  let fallback: Built | null = null;
  try {
    for (const dpi of budget === Infinity ? [150] : DPIS) {
      const sizes: number[][] = [], jpegs: Blob[][] = [], boxes: { w: number; h: number }[] = [];
      let floor = overhead(pages.length);
      for (const [i, { s, no }] of pages.entries()) {
        if (h.stale()) throw new Stale();
        h.progress(`Rebuilding page ${i + 1} of ${pages.length} · ${dpi} DPI`);
        boxes.push(s.kind === "pdf" ? await drawPdf(s.doc, no, c, dpi) : await drawImage((s as Extract<Source, { kind: "image" }>).bitmap, c, dpi));
        const ladder = budget === Infinity ? [await blob(c, QUALITIES[1])] : [];
        if (budget !== Infinity) for (const q of QUALITIES) ladder.push(await blob(c, q));
        jpegs.push(ladder); sizes.push(ladder.map((b) => b.size));
        floor += ladder[ladder.length - 1].size;
        if (floor > budget) break; // even the lowest quality won't fit at this resolution: go lower
      }
      if (floor > budget || sizes.length < pages.length) continue;
      for (let q = Math.max(0, pickQuality(sizes, budget - overhead(pages.length))); q < sizes[0].length; q++) {
        h.progress("Assembling…");
        const out = await fromJpegs(await Promise.all(jpegs.map(async (l, i) => ({ jpeg: await bytes(l[q]), ...boxes[i] }))));
        if (out.length > budget) continue;
        const r: Built = { bytes: out, mode: "rebuilt", dpi, quality: budget === Infinity ? QUALITIES[1] : QUALITIES[q], forced: false };
        // Heavy JPEG blocking hurts text more than fewer pixels do: try a lower resolution before accepting it.
        if (r.quality! < SHARP_Q && dpi > SHARP_DPI) { fallback ??= r; break; }
        return r;
      }
    }
    return fallback;
  } finally { c.width = c.height = 0; }
}
