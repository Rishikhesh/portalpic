// Find and swap the pictures inside a PDF, so it can shrink without touching its text, links or highlights.
// No DOM: decoding to pixels uses DecompressionStream, which bun has too.
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream, type PDFObject, type PDFRef } from "pdf-lib";

/** Long edge in pixels and JPEG quality tried for every picture, gentlest first. */
export const STEPS: { edge: number; q: number }[] = [
  { edge: 2400, q: 0.8 }, { edge: 2000, q: 0.72 }, { edge: 1700, q: 0.65 }, { edge: 1400, q: 0.58 }, { edge: 1200, q: 0.5 },
  { edge: 1000, q: 0.45 }, { edge: 850, q: 0.4 }, { edge: 700, q: 0.36 }, { edge: 560, q: 0.32 },
];

export type Img = { ref: PDFRef; filter: "jpeg" | "flate"; bytes: Uint8Array; w: number; h: number; comps: 1 | 3; predictor: boolean };

const n = (d: PDFDict, k: string) => (d.lookup(PDFName.of(k)) as PDFNumber | undefined)?.asNumber();
const name = (o: PDFObject | undefined): string | undefined => (o instanceof PDFName ? o.decodeText() : o instanceof PDFArray && o.size() === 1 ? name(o.lookup(0)) : undefined);

/** Colour channels for the colour spaces we can redraw faithfully: grey or RGB, plain or with an ICC profile. */
function channels(d: PDFDict): 1 | 3 | null {
  const cs = d.lookup(PDFName.of("ColorSpace"));
  const plain = name(cs);
  if (plain === "DeviceGray") return 1;
  if (plain === "DeviceRGB") return 3;
  if (cs instanceof PDFArray && name(cs.lookup(0)) === "ICCBased") {
    const icc = cs.lookup(1);
    const k = icc instanceof PDFRawStream ? n(icc.dict, "N") : undefined;
    return k === 1 || k === 3 ? k : null;
  }
  return null;
}

/**
 * Pictures worth recompressing: JPEG or Flate, 8-bit grey or RGB, at least `minBytes`.
 * Skips alpha masks, stencil masks, colour-key masks, inverted Decode arrays, CMYK, indexed and fax images:
 * redrawing those as an RGB JPEG would change how they look.
 */
export function findImages(doc: PDFDocument, minBytes = 10_000): Img[] {
  const objs = doc.context.enumerateIndirectObjects();
  const masks = new Set<string>();
  for (const [, o] of objs) {
    const m = o instanceof PDFRawStream ? o.dict.get(PDFName.of("SMask")) : undefined;
    if (m) masks.add(m.toString());
  }
  const out: Img[] = [];
  for (const [ref, o] of objs) {
    if (!(o instanceof PDFRawStream) || masks.has(ref.toString())) continue;
    const d = o.dict;
    if (name(d.get(PDFName.of("Subtype"))) !== "Image" || d.has(PDFName.of("ImageMask")) || d.has(PDFName.of("Mask")) || d.has(PDFName.of("Decode"))) continue;
    if (o.contents.length < minBytes || n(d, "BitsPerComponent") !== 8) continue;
    const w = n(d, "Width") ?? 0, h = n(d, "Height") ?? 0, comps = channels(d);
    if (!comps || w < 1 || h < 1 || w * h > 40e6) continue; // 40 MP: same bomb ceiling as photos
    const f = name(d.lookup(PDFName.of("Filter")));
    const parms = d.lookup(PDFName.of("DecodeParms"));
    const pred = parms instanceof PDFDict ? n(parms, "Predictor") ?? 1 : 1;
    if (f === "DCTDecode" && !parms) out.push({ ref, filter: "jpeg", bytes: o.contents, w, h, comps, predictor: false });
    else if (f === "FlateDecode" && (pred === 1 || pred >= 10)) out.push({ ref, filter: "flate", bytes: o.contents, w, h, comps, predictor: pred >= 10 });
  }
  return out;
}

/** Put a JPEG in place of the picture at `ref`. Pages keep pointing at the same object; its alpha mask stays. */
export function replaceImage(doc: PDFDocument, ref: PDFRef, jpeg: Uint8Array, w: number, h: number) {
  const old = (doc.context.lookup(ref) as PDFRawStream).dict;
  const dict: Record<string, PDFObject | string | number> = { Type: "XObject", Subtype: "Image", Width: w, Height: h, ColorSpace: "DeviceRGB", BitsPerComponent: 8, Filter: "DCTDecode" };
  for (const k of ["SMask", "Interpolate", "Intent"]) { const v = old.get(PDFName.of(k)); if (v) dict[k] = v; }
  doc.context.assign(ref, doc.context.stream(jpeg, dict));
}

export async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const s = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

/** Undo PNG row predictors (Predictor ≥ 10): each row starts with a filter-type byte. */
export function unpredict(data: Uint8Array, w: number, comps: number): Uint8Array {
  const row = w * comps, rows = Math.floor(data.length / (row + 1)), out = new Uint8Array(rows * row);
  for (let y = 0; y < rows; y++) {
    const t = data[y * (row + 1)], src = y * (row + 1) + 1, o = y * row;
    for (let x = 0; x < row; x++) {
      const a = x >= comps ? out[o + x - comps] : 0, b = y ? out[o - row + x] : 0, c = x >= comps && y ? out[o - row + x - comps] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = t === 1 ? a : t === 2 ? b : t === 3 ? (a + b) >> 1 : t === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0;
      out[o + x] = (data[src + x] + pred) & 255;
    }
  }
  return out;
}

/** Grey or RGB bytes to canvas RGBA. Throws if the stream is shorter than the picture. */
export function toRGBA(px: Uint8Array, w: number, h: number, comps: 1 | 3): Uint8ClampedArray<ArrayBuffer> {
  if (px.length < w * h * comps) throw new Error("short image data");
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0, j = 0; i < w * h; i++, j += comps) {
    out[i * 4] = px[j]; out[i * 4 + 1] = px[comps === 3 ? j + 1 : j]; out[i * 4 + 2] = px[comps === 3 ? j + 2 : j]; out[i * 4 + 3] = 255;
  }
  return out;
}
