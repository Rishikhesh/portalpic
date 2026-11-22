import { expect, test } from "bun:test";
import { PDFDocument } from "pdf-lib";
import { BadPdf, mergeKeep, fromJpegs } from "./build";

// 1×1 white baseline JPEG
const JPEG = Uint8Array.from(atob("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k="), (c) => c.charCodeAt(0));

async function pdf(pages: number) {
  const d = await PDFDocument.create();
  for (let i = 0; i < pages; i++) d.addPage([595, 842]);
  return d.save();
}

test("mergeKeep joins PDFs and images in order, one page per image", async () => {
  const out = await mergeKeep([
    { kind: "pdf", bytes: await pdf(2) },
    { kind: "jpg", bytes: JPEG, w: 300, h: 400 },
    { kind: "pdf", bytes: await pdf(1) },
  ]);
  const d = await PDFDocument.load(out, { updateMetadata: false });
  expect(d.getPageCount()).toBe(4);
  expect(d.getPage(2).getHeight()).toBe(842); // photo page, long side A4 height
  expect(d.getProducer()).toBe("PortalPic");
});

test("mergeKeep keeps only the picked pages, in the picked order, turned as asked", async () => {
  const d = await PDFDocument.create();
  for (const w of [100, 200, 300]) d.addPage([w, 842]); // page n is n×100 pt wide, so the order can be read back
  const out = await PDFDocument.load(await mergeKeep([{ kind: "pdf", bytes: await d.save(), picks: [{ no: 3, rot: 90 }, { no: 1, rot: 0 }] }]), { updateMetadata: false });
  expect(out.getPages().map((p) => p.getWidth())).toEqual([300, 100]);
  expect(out.getPages().map((p) => p.getRotation().angle)).toEqual([90, 0]);
});

test("mergeKeep refuses an encrypted PDF so the caller rebuilds it instead", async () => {
  const enc = new TextEncoder().encode("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R/Encrypt<</Filter/Standard>>>>\n%%EOF");
  expect(mergeKeep([{ kind: "pdf", bytes: await pdf(1) }, { kind: "pdf", bytes: enc }])).rejects.toEqual(new BadPdf(1));
});

test("fromJpegs makes one page per image at the given page size", async () => {
  const out = await fromJpegs([{ jpeg: JPEG, w: 595, h: 842 }, { jpeg: JPEG, w: 842, h: 595 }]);
  const d = await PDFDocument.load(out, { updateMetadata: false });
  expect(d.getPageCount()).toBe(2);
  expect(d.getPage(1).getWidth()).toBe(842);
});
