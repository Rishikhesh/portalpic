// Assemble PDFs with pdf-lib. No DOM, so it runs under `bun test`.
import { PDFDocument, degrees } from "pdf-lib";
import { imagePage } from "./plan";

/** One page of a file in the output: its number in that file (from 1) and how far the user turned it (0, 90, 180, 270). */
export type Pick = { no: number; rot: number };

export type Part =
  | { kind: "pdf"; bytes: Uint8Array; picks?: Pick[] } // picks: which pages, in what order; omitted means all of them
  | { kind: "jpg"; bytes: Uint8Array; w: number; h: number; pt?: { w: number; h: number } }; // pt: page size, for a redrawn PDF page

/** pdf-lib can't open the PDF at parts[index] (locked or damaged): redraw just that one. */
export class BadPdf extends Error { index: number; constructor(index: number) { super(`part ${index} unreadable`); this.index = index; } }

// Old-style cross-reference tables and a plain producer: the most widely accepted shape for strict upload portals.
export async function finish(d: PDFDocument) {
  d.setProducer("PortalPic"); d.setCreator("PortalPic (portalpic.com)");
  return d.save({ useObjectStreams: false });
}

/** Merge PDFs and photos into one PDF, keeping the original pages (text stays selectable). Throws BadPdf on encrypted or unreadable PDFs. */
export async function mergeKeep(parts: Part[]): Promise<Uint8Array> {
  const out = await PDFDocument.create({ updateMetadata: false });
  for (const [i, p] of parts.entries()) {
    if (p.kind === "pdf") {
      const src = await PDFDocument.load(p.bytes).catch(() => { throw new BadPdf(i); }); // EncryptedPDFError for locked files
      const picks = p.picks ?? src.getPageIndices().map((n) => ({ no: n + 1, rot: 0 }));
      for (const [k, page] of (await out.copyPages(src, picks.map((x) => x.no - 1))).entries()) {
        if (picks[k].rot) page.setRotation(degrees((page.getRotation().angle + picks[k].rot) % 360));
        out.addPage(page);
      }
    } else {
      const img = await out.embedJpg(p.bytes);
      const { w, h } = p.pt ?? imagePage(p.w, p.h);
      out.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h });
    }
  }
  return finish(out);
}

/** A fresh PDF with one full-page JPEG per page; w and h are the page size in points. */
export async function fromJpegs(pages: { jpeg: Uint8Array; w: number; h: number }[]): Promise<Uint8Array> {
  const out = await PDFDocument.create({ updateMetadata: false });
  for (const p of pages) {
    const img = await out.embedJpg(p.jpeg);
    out.addPage([p.w, p.h]).drawImage(img, { x: 0, y: 0, width: p.w, height: p.h });
  }
  return finish(out);
}
