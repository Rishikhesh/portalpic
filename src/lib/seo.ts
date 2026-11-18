import type { Spec } from "./spec";

export const SITE = "https://portalpic.com";
export const HOME_TITLE = "PortalPic: resize photos & signatures for exam and visa forms";
export const HOME_DESCRIPTION =
  "Free tool that resizes photos and signatures to the exact pixel size and KB limit of IBPS, SSC, UPSC, NEET, JEE, GATE, PAN, OCI and visa or passport forms for the US, UK, Canada, Australia and more. Runs in your browser; nothing is uploaded.";

const size = (kb: number) => (kb >= 1024 ? `${+(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
export const range = (s: Spec) => (s.minKB ? `${size(s.minKB)}–${size(s.maxKB)}` : `under ${size(s.maxKB)}`);

const name = (s: Spec) => `${s.group} ${s.label.toLowerCase()}`;

export const pagePath = (s: Spec) => (s.id === "custom" ? "/" : `/${s.id}`);
export const pageTitle = (s: Spec) => (s.id === "custom" ? HOME_TITLE : `${s.group} ${s.label} size & resizer: ${range(s)}, ${s.w}×${s.h} px | PortalPic`);
export const pageDescription = (s: Spec) =>
  s.id === "custom" ? HOME_DESCRIPTION
    : `Resize and compress your ${name(s)} to ${s.w} × ${s.h} pixels and ${range(s)}, free, in your browser. Nothing is uploaded. Rules checked against the official notice.`;
export const heading = (s: Spec) => (s.id === "custom" ? "Drop a photo or signature" : `Resize your ${name(s)}`);

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
