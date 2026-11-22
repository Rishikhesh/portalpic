import type { Spec } from "./spec";

export const SITE = "https://portalpic.com";
export const HOME_TITLE = "PortalPic: resize photos & signatures for exam and visa forms";
export const HOME_DESCRIPTION =
  "Free tool that resizes photos and signatures to the exact pixel size and KB limit of IBPS, SSC, UPSC, NEET, JEE, GATE, PAN, OCI and visa or passport forms for the US, UK, Canada, Australia and more. Runs in your browser; nothing is uploaded.";

const size = (kb: number) => (kb >= 1024 ? `${+(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
export const range = (s: Spec) => (s.minKB ? `${size(s.minKB)}–${size(s.maxKB)}` : `under ${size(s.maxKB)}`);

const name = (s: Spec) => `${s.group} ${s.label.toLowerCase()}`;

export const CUSTOM_TITLE = "Resize a photo to any pixel size and KB | PortalPic";
export const CUSTOM_DESCRIPTION = "Type the width, height and KB limit your form asks for and get a JPG that fits. Free, in your browser; nothing is uploaded.";

export const pagePath = (s: Spec) => `/${s.id}`;
export const pageTitle = (s: Spec) => (s.id === "custom" ? CUSTOM_TITLE : `${s.group} ${s.label} size & resizer: ${range(s)}, ${s.w}×${s.h} px | PortalPic`);
export const pageDescription = (s: Spec) =>
  s.id === "custom" ? CUSTOM_DESCRIPTION
    : `Resize and compress your ${name(s)} to ${s.w} × ${s.h} pixels and ${range(s)}, free, in your browser. Nothing is uploaded. Rules checked against the official notice.`;
export const heading = (s: Spec) => (s.id === "custom" ? "Resize to any size and KB" : `Resize your ${name(s)}`);

/** When the preset rules were last checked against their official sources. */
export const CHECKED = "November 2026";

const pixels = (s: Spec) => `${s.w} × ${s.h} pixels${s.exact ? "" : " (a size that meets the stated rules)"}`;
const format = (s: Spec) => `JPEG${s.dpi ? `, ${s.dpi} DPI` : ""}`;

/** One-line, citable statement of a preset's rules. */
export const factLine = (s: Spec) => `${pixels(s)}, ${range(s)}, ${format(s)}.`;

/** Short Q&A shown on each preset page and published as FAQPage structured data. */
export function faqs(s: Spec): { q: string; a: string }[] {
  if (s.id === "custom") return [];
  return [
    { q: `What is the ${name(s)} size?`,
      a: `${pixels(s)}, file size ${range(s)}, ${format(s)}.${s.note ? ` ${s.note}` : ""} Checked against the official notice in ${CHECKED}.` },
    { q: `How do I resize my ${name(s)} to ${range(s)}?`,
      a: `Open portalpic.com/${s.id}, add your photo or scan, frame it in the crop box and download. PortalPic picks the best JPEG quality inside the limit and checks the pixel size, file size and format before you download.` },
    { q: `Is it safe to resize my ${s.label.toLowerCase()} online?`,
      a: "PortalPic runs entirely in your browser: the image is never uploaded or stored, and it keeps working offline once loaded." },
  ];
}

export const PDF_TITLE = "Merge & compress PDF to KB or MB for upload portals | PortalPic";
export const PDF_DESCRIPTION =
  "Combine PDFs and photos into one PDF under 100 KB, 200 KB, 300 KB, 500 KB, 1 MB, 2 MB or 5 MB, and fix \"invalid PDF\" upload errors for exam, visa and passport portals. Free, in your browser; nothing is uploaded.";
export const PDF_FAQS = [
  { q: "How do I compress a PDF to 200 KB or 300 KB?",
    a: "Open portalpic.com/pdf, add the PDF, and pick the size limit. If the original is too big, PortalPic redraws each page at the sharpest resolution and quality that fit, then gives you a preview before you download." },
  { q: "How do I merge photos and PDFs into one PDF for upload?",
    a: "Add all the files at once, put them in order with the arrows, and download. Each photo becomes a page. Useful when a portal allows only one file or caps the number of uploads." },
  { q: "The portal says my PDF is invalid, corrupted or has a virus. How do I fix it?",
    a: "Turn on \"Rebuild every page\". PortalPic redraws every page into a brand-new, plain PDF with no scripts, links, signatures or locks, which strict portals accept." },
  { q: "Is it safe to compress my passport or Aadhaar PDF here?",
    a: "Yes. The PDF never leaves your device: it is read, merged and compressed by your own browser. Passwords for locked PDFs are used once in the tab and never stored." },
];
