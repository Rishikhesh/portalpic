import { PRESETS } from "./presets";

export type Spec = {
  id: string;
  group: string;
  label: string;
  w: number;
  h: number;
  exact?: boolean;
  minKB: number;
  maxKB: number;
  dpi?: number;
  note?: string;
  source?: string;
  official?: boolean;
};

export const presets = PRESETS;

export const groups = presets.reduce<Record<string, Spec[]>>((acc, p) => {
  (acc[p.group] ??= []).push(p);
  return acc;
}, {});

export type Custom = { w: number; h: number; minKB: number; maxKB: number };

export const customSpec = (c: Custom): Spec => {
  const maxKB = clamp(c.maxKB, 1, 20000, 50);
  const minKB = clamp(c.minKB, 0, 10000, 0);
  return {
    id: "custom", group: "Custom", label: "Custom size", exact: true,
    w: clamp(c.w, 16, 4000, 200), h: clamp(c.h, 16, 4000, 230),
    minKB: minKB < maxKB ? minKB : 0, // an impossible range would yield a file that can never pass
    maxKB,
  };
};

function clamp(v: number, lo: number, hi: number, fallback: number) {
  return Number.isFinite(v) && v > 0 ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback;
}

export const isInk = (s: Spec) => /sign|thumb|declaration/i.test(s.label);
