import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { CircleCheck, CircleX, Circle, Download, ExternalLink, LoaderCircle, TriangleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { Spec, Custom } from "@/lib/spec";
import type { Result } from "@/lib/process";
import { cn } from "@/lib/utils";

type Mark = "idle" | "pass" | "fail";

function StateIcon({ state }: { state: Mark }) {
  if (state === "pass") return <CircleCheck key="p" className="check-in size-4 shrink-0 text-pass" />;
  if (state === "fail") return <CircleX key="f" className="check-in size-4 shrink-0 text-fail" />;
  return <Circle className="size-4 shrink-0 text-line-strong" />;
}

const Section = ({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) => (
  <section className="border-b border-line px-5 py-5">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-medium text-muted-foreground">{title}</h2>
      {aside}
    </div>
    {children}
  </section>
);

function SizeMeter({ spec, result, target }: { spec: Spec; result: Result | null; target: number | null }) {
  const kb = result && !result.tooBig ? result.bytes / 1024 : null;
  const top = Math.max(spec.maxKB * 1.25, kb ? kb * 1.05 : 0);
  const pct = (v: number) => `${Math.min(100, (v / top) * 100)}%`;
  const ok = !!result?.fits;
  return (
    <div role="img" aria-label={kb !== null ? `${kb.toFixed(1)} KB, allowed ${spec.minKB || 0} to ${spec.maxKB} KB` : `Allowed ${spec.minKB || 0} to ${spec.maxKB} KB`}>
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-[19px] h-1 rounded-full bg-raised" />
        <div className="absolute top-[19px] h-1 rounded-full bg-pass/45"
          style={{ left: pct(spec.minKB || 0), width: `calc(${pct(spec.maxKB)} - ${pct(spec.minKB || 0)})` }} />
        {target !== null && (
          <div className="absolute top-[15px] h-3 w-px -translate-x-1/2 bg-ring" style={{ left: pct(target) }} title={`Target ${target} KB`} />
        )}
        {kb !== null && (
          <div className="needle absolute top-0 -translate-x-1/2" style={{ left: pct(kb) }}>
            <div className={cn("rounded-[4px] px-1.5 font-mono text-[11px] leading-[16px] font-medium whitespace-nowrap",
              ok ? "bg-foreground text-canvas" : "bg-fail text-canvas")}>{kb.toFixed(1)} KB</div>
            <div className={cn("mx-auto h-[10px] w-px", ok ? "bg-foreground" : "bg-fail")} />
          </div>
        )}
      </div>
      <div className="relative h-4 font-mono text-[11px] text-muted-foreground">
        <span className="absolute -translate-x-1/2" style={{ left: pct(spec.minKB || 0) }}>{spec.minKB || 0}</span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(spec.maxKB) }}>{spec.maxKB} KB</span>
      </div>
    </div>
  );
}

export function message(spec: Spec, r: Result) {
  if (r.tooBig) return { tone: "fail", text: `Can't get under ${spec.maxKB} KB at ${spec.w} × ${spec.h}. Crop tighter or use a plainer background.` };
  if (!r.fits) return { tone: "fail", text: "The file is outside the allowed size." };
  if (r.quality < 0.4) return { tone: "warn", text: "Fits, but quality is low. Zoom in or crop tighter." };
  if (r.padded) return { tone: "pass", text: "Ready. Padded with invisible bytes to reach the minimum size." };
  return { tone: "pass", text: "Ready to upload." };
}

export const filename = (spec: Spec) => `${spec.id}-${spec.w}x${spec.h}.jpg`;

export function DownloadButton({ spec, result, busy, className }: { spec: Spec; result: Result | null; busy: boolean; className?: string }) {
  const ready = !!result && !result.tooBig && result.fits && !busy;
  return (
    <a href={ready ? result!.url : undefined} download={ready ? filename(spec) : undefined} aria-disabled={!ready}
      onClick={() => track("download", { preset: spec.id })}
      className={cn("flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-[background,opacity] duration-150 hover:bg-white",
        !ready && "pointer-events-none opacity-35", className)}>
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
      {busy ? "Compressing…" : result ? `Download ${filename(spec)}` : "Download"}
    </a>
  );
}

const fields: { key: keyof Custom; label: string }[] = [
  { key: "w", label: "Width px" }, { key: "h", label: "Height px" }, { key: "minKB", label: "Min KB" }, { key: "maxKB", label: "Max KB" },
];

type Props = {
  spec: Spec; result: Result | null; busy: boolean;
  clean: boolean; onClean: (v: boolean) => void;
  custom: Custom; onCustom: (c: Custom) => void;
  targetKB: number | null; onTarget: (kb: number | null) => void;
};

export function Inspector({ spec, result, busy, clean, onClean, custom, onCustom, targetKB, onTarget }: Props) {
  const lo = spec.minKB || Math.max(1, Math.round(spec.maxKB * 0.1));
  const hi = spec.maxKB;
  const target = targetKB === null ? null : Math.min(hi, Math.max(lo, targetKB));
  const has = !!result && !busy;
  const base: Mark = has ? (result!.tooBig ? "fail" : "pass") : "idle";
  const kbMark: Mark = has ? (result!.fits ? "pass" : "fail") : "idle";
  const rows: [string, string, Mark, string?][] = [
    ["Dimensions", `${spec.w} × ${spec.h} px`, base, spec.exact ? undefined : "suggested"],
    ["File size", spec.minKB ? `${spec.minKB}–${spec.maxKB} KB` : `≤ ${spec.maxKB} KB`, kbMark],
    ["Format", "JPEG", base],
    ...(spec.dpi ? [["Resolution", `${spec.dpi} DPI`, base] as [string, string, Mark]] : []),
  ];

  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(300);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setRoom(e.contentRect.width)); ro.observe(el); return () => ro.disconnect();
  }, [result]);
  const scale = Math.min(1, room / spec.w, 260 / spec.h);
  const msg = result ? message(spec, result) : null;

  return (
    <div className="flex flex-col">
      <Section title="Requirements" aside={spec.source && (
        <a href={spec.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
          {spec.official ? "Official source" : "Source"} <ExternalLink className="size-3" />
        </a>
      )}>
        {spec.official === false && (
          <p className="mb-3 flex items-start gap-2 rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-[13px] text-warn">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> Not confirmed from an official notice.
          </p>
        )}
        {spec.id === "custom" && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {fields.map((f) => (
              <label key={f.key} className="text-[12px] text-muted-foreground">
                {f.label}
                <input type="number" inputMode="numeric" min={0} value={custom[f.key] || ""}
                  onChange={(e) => onCustom({ ...custom, [f.key]: Number(e.target.value) })}
                  className="mt-1 block h-9 w-full rounded-md border border-line-strong bg-raised px-2.5 font-mono text-[14px] text-foreground focus:border-ring focus:outline-none" />
              </label>
            ))}
          </div>
        )}
        <ul className="space-y-2.5">
          {rows.map(([label, value, mark, hint]) => (
            <li key={label} className="flex items-center gap-2.5">
              <StateIcon state={mark} />
              <span className="flex-1 text-[14px] text-muted-foreground">{label}</span>
              {hint && <span className="text-[12px] text-muted-foreground">{hint}</span>}
              <span className="font-mono text-[13px] text-foreground">{value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4"><SizeMeter spec={spec} result={has ? result : null} target={target} /></div>
        {spec.note && <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{spec.note}</p>}
      </Section>

      <Section title="Adjust">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-[14px] text-foreground">Clean paper background</span>
            <span className="block text-[12px] text-muted-foreground">Whitens paper, darkens ink. For signatures and thumbprints.</span>
          </span>
          <Switch checked={clean} onCheckedChange={onClean} />
        </label>

        <div className="mt-5">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-[14px] text-foreground">Target file size</span>
              <span className="block text-[12px] text-muted-foreground">
                {target === null ? "Off: best quality within the limit." : "The file lands at or just under this size."}
              </span>
            </span>
            <Switch checked={target !== null} onCheckedChange={(on) => onTarget(on ? Math.round((lo + hi) / 2) : null)} />
          </label>
          {target !== null && (
            <div className="mt-3 flex items-center gap-3">
              <Slider aria-label="Target file size in KB" min={lo} max={hi} step={hi - lo > 50 ? 5 : 1} value={[target]}
                onValueChange={([v]) => onTarget(v)} className="flex-1" />
              <span className="w-16 text-right font-mono text-[13px] text-foreground">{target} KB</span>
            </div>
          )}
          {target !== null && (
            <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-foreground"><span>{lo} KB</span><span>{hi} KB</span></div>
          )}
        </div>
      </Section>

      <Section title="Output" aside={result && <span className="font-mono text-[11px] text-muted-foreground">{scale === 1 ? "1:1" : `${Math.round(scale * 100)}%`}</span>}>
        <div ref={box} className="checker grid min-h-28 place-items-center rounded-md p-4">
          {result?.url ? (
            <img src={result.url} alt={`Result, ${spec.w} by ${spec.h} pixels`} width={Math.round(spec.w * scale)} height={Math.round(spec.h * scale)}
              className={cn("block shadow-[0_6px_20px_-6px_rgb(0_0_0/0.7)] transition-opacity", busy && "opacity-50")}
              style={{ imageRendering: scale === 1 ? "pixelated" : "auto" }} />
          ) : <span className="text-[13px] text-muted-foreground">{result ? "No file" : "Your file appears here"}</span>}
        </div>
        {result && !result.tooBig && (
          <p className="mt-2.5 font-mono text-[12px] text-muted-foreground">
            {(result.bytes / 1024).toFixed(1)} KB · {spec.w}×{spec.h} · q{Math.round(result.quality * 100)}{spec.dpi ? ` · ${spec.dpi} dpi` : ""}
          </p>
        )}
        {msg && (
          <p aria-live="polite" className={cn("mt-2 text-[14px] font-medium",
            msg.tone === "pass" ? "text-pass" : msg.tone === "warn" ? "text-warn" : "text-fail")}>{msg.text}</p>
        )}
      </Section>
    </div>
  );
}
