import { expect, test } from "bun:test";
import { PDFArray, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { findImages, inflate, replaceImage, toRGBA, unpredict } from "./images";

// 1×1 white baseline JPEG
const JPEG = Uint8Array.from(atob("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k="), (c) => c.charCodeAt(0));
// 2×1 RGBA PNG: red opaque, blue half transparent
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0eNT6AAAAEUlEQVR4nGP4z8DQwMDw/z8ADvsD/z6Pm3IAAAAASUVORK5CYII="), (c) => c.charCodeAt(0));

async function docWith(text = true) {
  const d = await PDFDocument.create();
  const p = d.addPage([595, 842]);
  p.drawImage(await d.embedJpg(JPEG), { x: 0, y: 0, width: 100, height: 100 });
  p.drawImage(await d.embedPng(PNG), { x: 0, y: 200, width: 100, height: 50 });
  if (text) p.drawText("Selectable text stays");
  return PDFDocument.load(await d.save());
}

test("findImages returns photos and flate images but never their alpha masks", async () => {
  const imgs = findImages(await docWith(), 0);
  expect(imgs.map((i) => i.filter).sort()).toEqual(["flate", "jpeg"]);
  const flate = imgs.find((i) => i.filter === "flate")!;
  expect([flate.w, flate.h, flate.comps]).toEqual([2, 1, 3]);
});

test("findImages skips images below the size floor", async () => {
  expect(findImages(await docWith(), 10_000)).toHaveLength(0);
});

test("a flate image decodes back to its pixels", async () => {
  const flate = findImages(await docWith(), 0).find((i) => i.filter === "flate")!;
  const rgba = toRGBA(await inflate(flate.bytes), flate.w, flate.h, flate.comps);
  expect([...rgba]).toEqual([255, 0, 0, 255, 0, 0, 255, 255]);
});

test("replaceImage swaps in a JPEG, keeps the alpha mask, and the text survives", async () => {
  const d = await docWith();
  const flate = findImages(d, 0).find((i) => i.filter === "flate")!;
  const mask = (d.context.lookup(flate.ref) as PDFRawStream).dict.get(PDFName.of("SMask"));
  replaceImage(d, flate.ref, JPEG, 1, 1);
  const out = await PDFDocument.load(await d.save());
  const s = (out.context.lookup(flate.ref) as PDFRawStream);
  expect(s.dict.get(PDFName.of("Filter"))).toBe(PDFName.of("DCTDecode"));
  expect(s.dict.get(PDFName.of("SMask"))).toEqual(mask);
  const parts = (out.context.lookup(out.getPage(0).node.get(PDFName.of("Contents"))) as PDFArray).asArray();
  const ops = await Promise.all(parts.map(async (r) => new TextDecoder("latin1").decode(await inflate((out.context.lookup(r) as PDFRawStream).contents))));
  expect(ops.join("")).toContain(" Tj"); // the text is still text
});

test("unpredict undoes PNG Sub and Up row filters", () => {
  // 2 rows × 2 px × 1 comp. Row 1 Sub: [10, 5] -> [10, 15]. Row 2 Up: [1, 1] -> [11, 16].
  expect([...unpredict(Uint8Array.from([1, 10, 5, 2, 1, 1]), 2, 1)]).toEqual([10, 15, 11, 16]);
});
