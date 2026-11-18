import type { Spec } from "./spec";

export const SITE = "https://portalpic.vercel.app";
export const HOME_TITLE = "PortalPic: resize photos & signatures for exam and visa forms";
export const HOME_DESCRIPTION =
  "Free tool that resizes photos and signatures to the exact pixel size and KB limit of IBPS, SSC, UPSC, NEET, JEE, GATE, PAN, OCI and visa or passport forms for the US, UK, Canada, Australia and more. Runs in your browser; nothing is uploaded.";

const size = (kb: number) => (kb >= 1024 ? `${+(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
export const range = (s: Spec) => (s.minKB ? `${size(s.minKB)}–${size(s.maxKB)}` : `under ${size(s.maxKB)}`);

const name = (s: Spec) => `${s.group} ${s.label.toLowerCase()}`;

export const pagePath = (s: Spec) => (s.id === "custom" ? "/" : `/${s.id}`);
export const pageTitle = (s: Spec) => (s.id === "custom" ? HOME_TITLE : `${s.group} ${s.label} resizer: ${s.w}×${s.h} px, ${range(s)} | PortalPic`);
export const pageDescription = (s: Spec) =>
  s.id === "custom" ? HOME_DESCRIPTION
    : `Resize and compress your ${name(s)} to ${s.w} × ${s.h} pixels and ${range(s)}, free, in your browser. Nothing is uploaded. Rules checked against the official notice.`;
export const heading = (s: Spec) => (s.id === "custom" ? "Drop a photo or signature" : `Resize your ${name(s)}`);
