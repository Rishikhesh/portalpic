import { useEffect, useRef, useState } from "react";
import { pageview } from "@vercel/analytics";
import { ArrowRight, CircleCheck, CircleX, Download, ExternalLink, LoaderCircle, TriangleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tick, Strike } from "@/components/Marks";
import { isInk, type Spec, type Custom } from "@/lib/spec";
import type { Result } from "@/lib/process";
import { cn } from "@/lib/utils";
import { faqs, range, CHECKED } from "@/lib/seo";

type Mark = "idle" | "pass" | "fail";

const Section = ({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) => (
  <section className="border-b border-line px-4 pt-6 pb-5 sm:px-5">
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2 className="text-[19px] leading-tight font-bold">{title}</h2>
      {aside}
    </div>
    {children}
  </section>
);

const size = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`);

/** File size drawn as a fill against the portal's limit; the tinted stretch is the allowed range. */
export function SizeMeter({ spec, result, target }: { spec: Pick<Spec, "minKB" | "maxKB">; result: Pick<Result, "bytes" | "fits" | "tooBig"> | null; target: number | null }) {
  const kb = result?.bytes ? result.bytes / 1024 : null;
  const top = Math.max(spec.maxKB * 1.25, kb ? kb * 1.05 : 0);
  const pct = (v: number) => `${Math.min(100, (v / top) * 100)}%`;
  const ok = !!result?.fits;
  return (
    <div role="img" aria-label={kb !== null ? `${kb.toFixed(1)} KB, allowed ${spec.minKB || 0} to ${spec.maxKB} KB` : `Allowed ${spec.minKB || 0} to ${spec.maxKB} KB`}>
      <div className="relative h-9">
        <div className="absolute inset-x-0 top-[22px] h-3 border border-line-strong bg-panel" />
        <div className="absolute top-[22px] h-3 border-x border-line-strong bg-pen/15"
          style={{ left: pct(spec.minKB || 0), width: `calc(${pct(spec.maxKB)} - ${pct(spec.minKB || 0)})` }} />
        {kb !== null && <div className={cn("fill absolute inset-x-0 top-[22px] h-3 origin-left", ok ? "bg-pen" : "bg-fail")} style={{ transform: `scaleX(${Math.min(1, kb / top)})` }} />}
        {target !== null && (
          <div className="absolute top-[19px] h-[18px] w-0.5 -translate-x-1/2 bg-line-strong" style={{ left: pct(target) }} title={`Target ${target} KB`} />
        )}
        {kb !== null && (
          <div className={cn("fill absolute top-0 -translate-x-1/2 rounded-sm px-1.5 text-[14px] leading-[20px] font-semibold whitespace-nowrap text-primary-foreground", ok ? "bg-pen" : "bg-fail")}
            style={{ left: `clamp(36px, ${pct(kb)}, calc(100% - 36px))` }}>{size(kb * 1024)}</div>
        )}
      </div>
      <div className="relative mt-1 h-5 text-[14px] text-muted-foreground">
        <span className="absolute -translate-x-1/2" style={{ left: pct(spec.minKB || 0) }}>{spec.minKB || 0}</span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pct(spec.maxKB) }}>{spec.maxKB} KB</span>
      </div>
    </div>
  );
}

export function message(spec: Spec, r: Result) {
  if (r.tooBig) return { tone: "fail", text: `This picture can't go under ${spec.maxKB} KB at ${spec.w} × ${spec.h}. Zoom in closer or use a plainer background.` };
  if (!r.fits) return { tone: "fail", text: "The file size is outside the portal's limit." };
  if (r.quality < 0.4) return { tone: "warn", text: "It fits, but it may look blurry. Zoom in closer." };
  return { tone: "pass", text: "Ready to upload." };
}

export const filename = (spec: Spec) => `${spec.id}-${spec.w}x${spec.h}.jpg`;

// Free-plan analytics only counts page views, so each download is recorded as a visit to /_download/<preset>.
const countDownload = (id: string) => pageview({ route: "/_download/[preset]", path: `/_download/${id}` });

const tones = { pass: ["text-pass", CircleCheck], warn: ["text-warn", TriangleAlert], fail: ["text-fail", CircleX] } as const;

type BarProps = {
  spec: Spec; result: Result | null; busy: boolean; className?: string;
  /** Presets downloaded in this visit. */
  done: Set<string>;
  /** The next upload this form still needs, if any. */
  next: Spec | null;
  onNext: (id: string) => void;
  onDownloaded: (id: string) => void;
};

/** The verdict and the one action that follows it: Download, then the next upload of the same form. */
export function ResultBar({ spec, result, busy, className, done, next, onNext, onDownloaded }: BarProps) {
  const ready = !!result && !result.tooBig && result.fits && !busy;
  const msg = result ? message(spec, result) : null;
  const saved = done.has(spec.id);
  const [tone, Icon] = msg ? tones[msg.tone as keyof typeof tones] : ["text-muted-foreground", null];
  const link = { href: ready ? result!.url : undefined, download: ready ? filename(spec) : undefined, "aria-disabled": !ready,
    onClick: () => { countDownload(spec.id); onDownloaded(spec.id); } };
  return (
    <div className={className}>
      <p aria-live="polite" className={cn("mb-2.5 flex items-start gap-2 text-[17px] leading-snug font-semibold transition-opacity", tone, busy && "opacity-50")}>
        {Icon && <Icon className="mt-[2px] size-5 shrink-0" />}
        <span>
          {msg ? msg.text : "Add your picture to check it against the rules."}
          {msg?.tone === "pass" && result && <span className="font-normal text-foreground"> {size(result.bytes)}, {spec.w} × {spec.h} px.</span>}
        </span>
      </p>
      <div className="flex gap-2">
        {saved && next ? (
          <button type="button" onClick={() => onNext(next.id)} className="btn-pen min-w-0 flex-1">
            <span className="truncate">Next: {next.label}</span> <ArrowRight className="size-4 shrink-0" />
          </button>
        ) : (
          <a {...link} className="btn-pen flex-1">
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
            {busy ? "Working…" : saved ? "Download again" : "Download"}
          </a>
        )}
      </div>
      {saved && (
        <p className="mt-2 text-[14px] text-muted-foreground">
          Saved as {filename(spec)}. Upload that file on the portal.
          {next && ready && <> <a {...link} className="link-pen">Download again</a></>}
          {!next && <> Documents to upload too? <a href="/pdf" className="link-pen">Merge or compress a PDF</a></>}
        </p>
      )}
    </div>
  );
}

const fields: { key: keyof Custom; label: string }[] = [
  { key: "w", label: "Width px" },
  { key: "h", label: "Height px" },
  { key: "minKB", label: "Min KB" },
  { key: "maxKB", label: "Max KB" },
];

type Props = {
  spec: Spec;
  result: Result | null;
  busy: boolean;
  clean: boolean;
  onClean: (v: boolean) => void;
  custom: Custom;
  onCustom: (c: Custom) => void;
  targetKB: number | null;
  onTarget: (v: number | null) => void;
};

const td = "border border-line-strong px-2 py-2.5";

export function Inspector({ spec, result, busy, clean, onClean, custom, onCustom, targetKB, onTarget }: Props) {
  const lo = spec.minKB || Math.max(1, Math.round(spec.maxKB * 0.1));
  const hi = spec.maxKB;
  const target = targetKB === null ? null : Math.min(hi, Math.max(lo, targetKB));
  const has = !!result && !busy;
  // When no file could be made, only the file-size rule is broken; the other rows have nothing to show.
  const base: Mark = has && !result!.tooBig ? "pass" : "idle";
  const kbMark: Mark = has ? (result!.fits ? "pass" : "fail") : "idle";
  const px = `${spec.w} × ${spec.h} px`;
  // What the portal printed, and the same line measured on the applicant's own file.
  const rows: { rule: string; asks: string; yours: string; mark: Mark; hint?: string }[] = [
    { rule: "Size", asks: px, yours: px, mark: base, hint: spec.exact ? undefined : "suggested" },
    { rule: "File size", asks: spec.minKB && spec.maxKB < 1024 ? `${spec.minKB}–${spec.maxKB} KB` : range(spec), yours: result?.bytes ? size(result.bytes) : `over ${spec.maxKB} KB`, mark: kbMark },
    { rule: "Format", asks: "JPG", yours: "JPG", mark: base },
    ...(spec.dpi ? [{ rule: "DPI", asks: `${spec.dpi} DPI`, yours: `${spec.dpi} DPI`, mark: base }] : []),
  ];

  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(300);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setRoom(e.contentRect.width)); ro.observe(el); return () => ro.disconnect();
  }, [result]);
  const scale = Math.min(1, room / spec.w, 260 / spec.h);

  return (
    <div className="flex flex-col">
      <Section title="What the portal asks" aside={spec.source && (
        <a href={spec.source} target="_blank" rel="noopener noreferrer" className="link-pen inline-flex shrink-0 items-center gap-1 text-[14px]">
          {spec.official ? "Official source" : "Source"} <ExternalLink className="size-3" />
        </a>
      )}>
        {spec.official === false && (
          <p className="mb-3 flex items-start gap-2 border border-warn px-3 py-2 text-[14px] font-medium text-warn">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> Not confirmed from an official notice. Check the portal before you upload.
          </p>
        )}
        {spec.id === "custom" && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {fields.map((f) => (
              <label key={f.key} className="text-[14px] text-muted-foreground">
                {f.label}
                <input type="number" inputMode="numeric" min={0} value={custom[f.key] || ""}
                  onChange={(e) => onCustom({ ...custom, [f.key]: Number(e.target.value) })}
                  className="mt-1 block h-11 w-full border border-line-strong bg-panel px-2.5 text-[16px] font-semibold text-pen focus:outline-2 focus:outline-offset-2 focus:outline-pen" />
              </label>
            ))}
          </div>
        )}
        <table className="w-full table-fixed border-collapse border border-line-strong bg-panel text-[15px]">
          <thead>
            <tr className="text-left text-[13px] tracking-[0.04em] uppercase">
              <th scope="col" className={cn(td, "w-[78px] py-1.5")}>Rule</th>
              <th scope="col" className={cn(td, "py-1.5")}>Portal asks</th>
              <th scope="col" className={cn(td, "py-1.5 text-pen")}>Your file</th>
              <th scope="col" className={cn(td, "w-9 py-1.5")}><span className="sr-only">Check</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rule, asks, yours, mark, hint }, i) => (
              <tr key={rule}>
                <th scope="row" className={cn(td, "text-left font-sans font-normal text-muted-foreground")}>{rule}</th>
                <td className={cn(td, "font-semibold")}>
                  {asks}{hint && <span className="block text-[14px] font-normal text-muted-foreground">{hint}</span>}
                </td>
                <td className={cn(td, "font-semibold", mark === "fail" ? "text-fail" : "text-pen")}>
                  {mark === "idle" ? <span className="font-normal text-muted-foreground">{busy ? "…" : "—"}</span> : yours}
                </td>
                <td className={cn(td, "px-0")}>
                  <span className="grid place-items-center">
                    {mark === "pass" && <><Tick key="p" delay={i * 90} /><span className="sr-only">Meets the rule</span></>}
                    {mark === "fail" && <><Strike key="f" delay={i * 90} /><span className="sr-only">Breaks the rule</span></>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3"><SizeMeter spec={spec} result={has ? result : null} target={target} /></div>
        {spec.note && <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{spec.note}</p>}
        {spec.id !== "custom" && <p className="mt-2 text-[14px] text-muted-foreground">Rules checked in {CHECKED}.</p>}
      </Section>

      <Section title="Options">
        {(isInk(spec) || spec.id === "custom") && (
          <label className="mb-3 flex min-h-12 cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block text-[16px] font-medium">Whiten the paper</span>
              <span className="block text-[14px] text-muted-foreground">Makes the paper white and the ink dark. For signatures and thumbprints.</span>
            </span>
            <Switch checked={clean} onCheckedChange={onClean} />
          </label>
        )}
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-[16px] font-medium">Set an exact file size</span>
            <span className="block text-[14px] text-muted-foreground">
              {target === null ? "Off: the best quality that fits the limit." : "The file lands at or just under this size."}
            </span>
          </span>
          <Switch checked={target !== null} onCheckedChange={(on) => onTarget(on ? Math.round((lo + hi) / 2) : null)} />
        </label>
        {target !== null && (
          <>
            <div className="mt-3 flex items-center gap-3">
              <Slider aria-label="Target file size in KB" min={lo} max={hi} step={hi - lo > 50 ? 5 : 1} value={[target]}
                onValueChange={([v]) => onTarget(v)} className="flex-1" />
              <span className="w-16 text-right text-[14px] font-semibold text-pen">{target} KB</span>
            </div>
            <div className="mt-1 flex justify-between pr-[76px] text-[14px] text-muted-foreground"><span>{lo} KB</span><span>{hi} KB</span></div>
          </>
        )}
      </Section>

      {result?.url && (
        <Section title="Your file" aside={<span className="text-[14px] text-muted-foreground">{scale === 1 ? "shown at real size" : `shown at ${Math.round(scale * 100)}%`}</span>}>
          <div ref={box} className="grid min-h-28 place-items-center border border-line bg-raised p-4">
            <img src={result.url} alt={`Your file, ${spec.w} by ${spec.h} pixels`} width={Math.round(spec.w * scale)} height={Math.round(spec.h * scale)}
              className={cn("block border border-line-strong transition-opacity", busy && "opacity-50")}
              style={{ imageRendering: scale === 1 ? "pixelated" : "auto" }} />
          </div>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {size(result.bytes)} · {spec.w} × {spec.h} px · JPG{spec.dpi ? ` · ${spec.dpi} DPI` : ""}
          </p>
          {result.padded && <p className="mt-1 text-[14px] text-muted-foreground">Made a little bigger to reach the {spec.minKB} KB minimum. The picture itself is unchanged.</p>}
        </Section>
      )}

      {faqs(spec).length > 0 && (
        <Section title={`About the ${spec.group} ${spec.label.toLowerCase()}`}>
          <dl className="max-w-[70ch] space-y-4">
            {faqs(spec).map(({ q, a }) => (
              <div key={q}>
                <dt className="text-[15px] font-semibold">{q}</dt>
                <dd className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{a}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  );
}
