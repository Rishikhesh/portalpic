import { fitQuality, padJpeg, setJpegDpi, maxBytes, minBytes } from "./compress.js";
import { PRESETS } from "./presets.js";

const $ = (id) => document.getElementById(id);
const S = { img: null, rot: 0, zoom: 1, cx: 0, cy: 0, url: null, job: 0 };

// ---------- presets ----------
const sel = $("preset");
const groups = {};
for (const p of PRESETS) (groups[p.group] ??= []).push(p);
for (const [g, list] of Object.entries(groups)) {
  const og = document.createElement("optgroup"); og.label = g;
  for (const p of list) og.append(new Option(`${g}: ${p.label}`, p.id));
  sel.append(og);
}
sel.append(new Option("Custom size…", "custom"));
try { const last = localStorage.getItem("pp.preset"); if (last && [...sel.options].some(o => o.value === last)) sel.value = last; } catch {}

function spec() {
  if (sel.value !== "custom") return PRESETS.find((p) => p.id === sel.value);
  const n = (id) => Math.max(0, Number($(id).value) || 0);
  return { id: "custom", label: "Custom", exact: true, w: n("cw") || null, h: n("ch") || null, minKB: n("cmin"), maxKB: n("cmax") || 50 };
}

function showSpec() {
  const p = spec();
  $("custom").classList.toggle("on", p.id === "custom");
  const chips = [];
  chips.push(p.w && p.h ? `${p.w} × ${p.h} px${p.exact ? "" : " · suggested"}` : "any size");
  chips.push(p.minKB ? `${p.minKB}–${p.maxKB} KB` : `≤ ${p.maxKB} KB`);
  if (p.official === false) chips.push("unverified");
  chips.push("JPG");
  if (p.dpi) chips.push(`${p.dpi} DPI`);
  $("chips").innerHTML = chips.map((c) => `<span class="chip">${c}</span>`).join("");
  const note = $("pnote"); note.textContent = p.note || "";
  if (p.source) { const a = document.createElement("a"); a.href = p.source; a.target = "_blank"; a.rel = "noopener"; a.textContent = p.official ? "Official source" : "Source"; note.append(" ", a); }
  $("whiten").checked = /sign|thumb|declaration/i.test(p.label || ""); // ink-on-paper presets
}
sel.addEventListener("change", () => { try { localStorage.setItem("pp.preset", sel.value); } catch {} showSpec(); resetView(); run(); });
for (const id of ["cw", "ch", "cmin", "cmax"]) $(id).addEventListener("input", () => { resetView(); run(); });
showSpec();

// ---------- input ----------
async function load(file) {
  if (!file || !file.type.startsWith("image/")) return;
  try {
    S.img = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    $("adjhint").textContent = "This browser can't read that file. Try a JPG or PNG.";
    return;
  }
  S.rot = 0; resetView();
  $("adjust").classList.add("on"); $("adjhint").style.display = "none";
  run();
}
$("file").addEventListener("change", (e) => load(e.target.files[0]));
const drop = $("drop");
drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
drop.addEventListener("dragleave", () => drop.classList.remove("over"));
drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); load(e.dataTransfer.files[0]); });
window.addEventListener("paste", (e) => { const f = [...e.clipboardData.files][0]; if (f) load(f); });

// ---------- crop geometry ----------
const srcW = () => (S.rot % 180 ? S.img.height : S.img.width);
const srcH = () => (S.rot % 180 ? S.img.width : S.img.height);

function outSize() {
  const p = spec();
  if (p.w && p.h) return [p.w, p.h];
  const w = srcW(), h = srcH(), k = Math.min(1, 1600 / Math.max(w, h)); // free size: keep aspect, cap long edge
  return [Math.round(w * k), Math.round(h * k)];
}

// Source rectangle (in rotated-image space) that the output shows.
function rect() {
  const [W, H] = outSize();
  const s = Math.max(W / srcW(), H / srcH()) * S.zoom;
  const w = W / s, h = H / s;
  S.cx = Math.min(Math.max(S.cx, w / 2), srcW() - w / 2);
  S.cy = Math.min(Math.max(S.cy, h / 2), srcH() - h / 2);
  return { x: S.cx - w / 2, y: S.cy - h / 2, w, h };
}

function resetView() {
  if (!S.img) return;
  S.zoom = 1; $("zoom").value = 1;
  S.cx = srcW() / 2; S.cy = srcH() / 2;
}

// Rotated copy of the source, so cropping math stays axis-aligned.
let rotCache = null;
function source() {
  if (!S.rot) return S.img;
  if (rotCache?.img === S.img && rotCache.rot === S.rot) return rotCache.c;
  const c = new OffscreenCanvas(srcW(), srcH()), g = c.getContext("2d");
  g.translate(c.width / 2, c.height / 2); g.rotate((S.rot * Math.PI) / 180);
  g.drawImage(S.img, -S.img.width / 2, -S.img.height / 2);
  rotCache = { img: S.img, rot: S.rot, c };
  return c;
}

function draw(canvas, W, H) {
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); // flatten transparency to white
  g.imageSmoothingQuality = "high";
  const r = rect();
  g.drawImage(source(), r.x, r.y, r.w, r.h, 0, 0, W, H);
  if ($("whiten").checked) whiten(g, W, H);
}

// Push near-white paper to pure white and deepen ink, so signatures compress cleanly and read crisply.
function whiten(g, W, H) {
  const d = g.getImageData(0, 0, W, H), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const l = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
    if (l > 165) { a[i] = a[i + 1] = a[i + 2] = 255; }
    else { const k = l / 165; a[i] *= k; a[i + 1] *= k; a[i + 2] *= k; }
  }
  g.putImageData(d, 0, 0);
}

// ---------- crop preview + drag ----------
const crop = $("crop");
function preview() {
  const [W, H] = outSize(), k = Math.min(360 / H, 560 / W); // fit the box; small outputs scale up
  draw(crop, Math.round(W * k), Math.round(H * k));
}
let drag = null;
crop.addEventListener("pointerdown", (e) => { if (!S.img) return; crop.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY }; });
crop.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const r = rect(), k = r.w / crop.getBoundingClientRect().width;
  S.cx -= (e.clientX - drag.x) * k; S.cy -= (e.clientY - drag.y) * k;
  drag = { x: e.clientX, y: e.clientY };
  preview();
});
crop.addEventListener("pointerup", () => { drag = null; run(); });
crop.addEventListener("wheel", (e) => { if (!S.img) return; e.preventDefault(); S.zoom = Math.min(4, Math.max(1, S.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06))); $("zoom").value = S.zoom; run(); }, { passive: false });
$("zoom").addEventListener("input", (e) => { S.zoom = Number(e.target.value); run(); });
$("whiten").addEventListener("change", run);
$("rotate").addEventListener("click", () => { if (!S.img) return; S.rot = (S.rot + 90) % 360; resetView(); run(); });

// ---------- encode ----------
const encode = (canvas) => (q) => new Promise((res) =>
  canvas.toBlob(async (b) => res(new Uint8Array(await b.arrayBuffer())), "image/jpeg", q));

let timer;
function run() {
  if (!S.img) return;
  preview();
  clearTimeout(timer);
  timer = setTimeout(compress, 120);
}

async function compress() {
  const job = ++S.job, p = spec();
  const max = maxBytes(p.maxKB), min = p.minKB ? minBytes(p.minKB) : 0;
  let [W, H] = outSize();
  const fixed = !!(p.w && p.h);
  const c = document.createElement("canvas");
  let r = null;
  for (let tries = 0; tries < 12; tries++) {
    draw(c, W, H);
    r = await fitQuality(encode(c), max);
    if (r || fixed) break;
    W = Math.round(W * 0.85); H = Math.round(H * 0.85); // free size: shrink until it fits
  }
  if (job !== S.job) return; // a newer edit superseded this run

  $("out").classList.add("on"); $("outhint").style.display = "none";
  const status = $("status"), dl = $("dl");
  $("sReq").textContent = `${p.w && p.h ? `${p.w}×${p.h}, ` : ""}${p.minKB ? `${p.minKB}–` : "≤ "}${p.maxKB} KB`;
  if (!r) {
    status.className = "status bad";
    status.textContent = `Can't get this under ${p.maxKB} KB at ${W}×${H}. Try zooming in or a simpler background.`;
    dl.setAttribute("aria-disabled", "true");
    return;
  }
  let bytes = r.bytes, padded = false;
  if (min && bytes.length < min) { // too small: spend the room on real quality before padding
    const best = await encode(c)(1);
    if (best.length <= max) r = { bytes: (bytes = best), quality: 1 };
  }
  if (job !== S.job) return;
  if (min && bytes.length < min && min < max) { bytes = padJpeg(bytes, Math.min(max, min + 512)); padded = true; }
  if (p.dpi) bytes = setJpegDpi(bytes, p.dpi);

  if (S.url) URL.revokeObjectURL(S.url);
  S.url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
  $("preview").src = S.url;
  $("preview").style.width = `${Math.min(W, 320)}px`;
  $("sKB").textContent = `${(bytes.length / 1024).toFixed(1)} KB`;
  $("sDim").textContent = `${W} × ${H} px`;
  $("sQ").textContent = `${Math.round(r.quality * 100)}%`;
  const okSize = bytes.length <= max && bytes.length >= min;
  status.className = `status ${okSize ? (r.quality < 0.4 ? "warn" : "ok") : "bad"}`;
  status.textContent = !okSize ? "Size is outside the limit."
    : r.quality < 0.4 ? "✓ Fits, but quality is low. Zoom in or crop tighter for a sharper result."
    : padded ? "✓ Fits. A small invisible filler was added to reach the minimum size." : "✓ Ready to upload.";
  dl.href = S.url; dl.download = `${p.id}-${W}x${H}.jpg`; dl.setAttribute("aria-disabled", "false");
}
