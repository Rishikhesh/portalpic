import { useCallback, useEffect, useRef, useState } from "react";
import { pageview } from "@vercel/analytics";
import { ArrowDown, ArrowUp, Download, Eye, FilePlus2, FileStack, ImageIcon, LoaderCircle, Lock, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/Logo";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { SizeMeter } from "@/components/Inspector";
import { maxBytes } from "@/lib/compress";
import { build, closeSource, openSource, OpenError, Stale, type Built, type Source } from "@/lib/pdf/raster";
import { cn } from "@/lib/utils";
import { PDF_TITLE } from "@/lib/seo";

/** Size limits people meet most: exam portals ask for a few hundred KB, visa portals for a few MB. 1 MB = 1000 KB, the strict reading. */
const LIMITS = [100, 200, 300, 500, 1000, 2000, 5000];
const label = (kb: number) => (kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`);
const fmt = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`);
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
type Output = (Built & { url: string }) | { tooBig: true };

export default function PdfApp() {
  const [sources, setSources] = useState<Source[]>([]);
  const [limit, setLimit] = useState<number | null>(() => { const v = store.get("pp.pdfLimit"); return v === "none" ? null : Number(v) || 1000; });
  const [rebuild, setRebuild] = useState(false);
  const [out, setOut] = useState<Output | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const job = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const live = useRef<Source[]>([]);
  live.current = sources;

  useEffect(() => { document.title = PDF_TITLE; }, []);
  useEffect(() => () => live.current.forEach(closeSource), []);

  const add = useCallback(async (files: FileList | File[]) => {
    setError(null);
    for (const f of Array.from(files)) {
      try { const s = await openSource(f); setSources((l) => [...l, s]); }
      catch (e) { setError(e instanceof OpenError || (e instanceof Error && e.message) ? (e as Error).message : `Couldn't open ${f.name}.`); }
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => { if (e.clipboardData?.files.length) void add(e.clipboardData.files); };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [add]);

  const unlock = async (s: Source, password: string) => {
    const next = await openSource(s.file, password).catch(() => null);
    if (next) setSources((l) => l.map((x) => (x.id === s.id ? next : x)));
  };
  const move = (i: number, d: number) => setSources((l) => { const c = [...l]; [c[i], c[i + d]] = [c[i + d], c[i]]; return c; });
  const remove = (s: Source) => { closeSource(s); setSources((l) => l.filter((x) => x !== s)); };
  const pickLimit = (kb: number | null) => { setLimit(kb); store.set("pp.pdfLimit", kb === null ? "none" : String(kb)); };

  // Rebuild whenever files, order, limit or mode change. Debounced; a newer run cancels an older one between pages.
  const ready = sources.length > 0 && sources.every((s) => s.kind !== "pdf-locked");
  useEffect(() => {
    if (!ready) { setOut(null); setProgress(null); return; }
    const id = ++job.current;
    const t = setTimeout(async () => {
      setProgress("Starting…");
      try {
        const r = await build(sources, limit === null ? Infinity : maxBytes(limit), rebuild,
          { progress: (p) => { if (id === job.current) setProgress(p); }, stale: () => id !== job.current });
        if (id !== job.current) return;
        setOut(r ? { ...r, url: URL.createObjectURL(new Blob([r.bytes as BlobPart], { type: "application/pdf" })) } : { tooBig: true });
      } catch (e) {
        if (e instanceof Stale || id !== job.current) return;
        setOut(null); setError("Couldn't build the PDF. Try removing the last file you added.");
      }
      setProgress(null);
    }, 250);
    return () => clearTimeout(t);
  }, [sources, limit, rebuild, ready]);
  useEffect(() => () => { if (out && "url" in out) URL.revokeObjectURL(out.url); }, [out]);

  const pages = sources.reduce((n, s) => n + s.pages, 0);
  const busy = progress !== null;
  const done = out && "url" in out && !busy ? out : null;
  const name = `${(sources[0]?.name ?? "document").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").toLowerCase() || "document"}${sources.length > 1 ? "-merged" : ""}.pdf`;
  const verdict = !out || busy ? null
    : "tooBig" in out ? { tone: "fail", text: `Can't get this under ${label(limit!)} and keep it readable. Remove pages, or split it into two files.` }
    : out.mode === "kept" ? { tone: "pass", text: out.forced ? "Ready." : "Ready. Original pages kept, so text stays sharp and selectable." }
    : (out.dpi! <= 72 || out.quality! < 0.3) ? { tone: "warn", text: "Fits, but small text may be hard to read. Open the preview to check." }
    : { tone: "pass", text: "Ready. Every page was redrawn as a clean image, which portals accept." };

  const download = (
    <a href={done?.url} download={done ? name : undefined} aria-disabled={!done}
      onClick={() => pageview({ route: "/_download/[preset]", path: "/_download/pdf" })}
      className={cn("flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-[background,opacity] duration-150 hover:bg-white",
        !done && "pointer-events-none opacity-35")}>
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
      {busy ? "Working…" : done ? `Download PDF · ${fmt(done.bytes.length)}` : "Download PDF"}
    </a>
  );
  const preview = done && (
    <a href={done.url} target="_blank" rel="noopener" className="grid size-11 shrink-0 place-items-center rounded-md border border-line-strong text-muted-foreground hover:bg-accent hover:text-foreground" title="Open the PDF to check it" aria-label="Preview PDF">
      <Eye className="size-4" />
    </a>
  );

  return (
    <div className="flex min-h-svh flex-col lg:h-svh">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-panel px-4">
        <a href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em]"><Logo /> PortalPic</a>
        <span className="h-5 w-px bg-line" />
        <span className="text-[14px] text-muted-foreground">PDF</span>
        <div className="ml-auto flex items-center gap-1">
          <PrivacyDialog>
            <button type="button" className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground sm:flex">
              <ShieldCheck className="size-4 text-pass" /> Processed on your device
            </button>
          </PrivacyDialog>
          <a href="/" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-foreground hover:bg-accent"><ImageIcon className="size-4" /> Photo & signature</a>
        </div>
      </header>

      <main className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="canvas-grid min-w-0 lg:min-h-0 lg:overflow-y-auto"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void add(e.dataTransfer.files); }}>
          <input ref={input} type="file" multiple accept="application/pdf,.pdf,image/*" onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ""; }} />
          {sources.length === 0 ? (
            <div className="grid min-h-[60svh] place-items-center px-6 py-14 text-center lg:h-full">
              <div className="flex max-w-[26rem] flex-col items-center">
                <div className="mb-5 grid size-14 place-items-center rounded-xl border border-line-strong bg-panel text-muted-foreground"><FileStack className="size-6" strokeWidth={1.6} /></div>
                <h1 className="text-[19px] font-semibold tracking-[-0.01em] text-balance">Merge and compress PDFs for upload portals</h1>
                <p className="mt-1.5 text-[14px] text-muted-foreground">
                  Combine PDFs and photos into one file under the portal's size limit, and fix "invalid PDF" errors. It all happens in your browser; nothing is uploaded.{" "}
                  <PrivacyDialog><button type="button" className="text-foreground underline">How we know</button></PrivacyDialog>
                </p>
                <Button onClick={() => input.current?.click()} className="mt-6 h-11 rounded-md px-5 text-[15px] font-semibold">Choose files</Button>
                <p className="mt-3 font-mono text-[12px] text-muted-foreground">PDF · JPG · PNG · HEIC · several at once · or paste</p>
                {error && <p role="alert" className="mt-4 text-[14px] font-medium text-fail">{error}</p>}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl px-4 py-5">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-[15px] font-semibold">{sources.length} file{sources.length > 1 ? "s" : ""} · {pages} page{pages === 1 ? "" : "s"}</h1>
                <span className="text-[12px] text-muted-foreground">Joined top to bottom</span>
              </div>
              <ol className="space-y-2">
                {sources.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-lg border border-line bg-panel p-2.5">
                    <div className="grid h-14 w-11 shrink-0 place-items-center overflow-hidden rounded-[4px] bg-raised">
                      {s.thumb ? <img src={s.thumb} alt="" className="max-h-full max-w-full" /> : <Lock className="size-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-foreground">{s.name}</p>
                      {s.kind === "pdf-locked" ? (
                        <form className="mt-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); void unlock(s, new FormData(e.currentTarget).get("pw") as string); }}>
                          <input name="pw" type="password" autoComplete="off" placeholder="PDF password" aria-label={`Password for ${s.name}`}
                            className="h-8 min-w-0 flex-1 rounded-md border border-line-strong bg-raised px-2.5 text-[13px] focus:border-ring focus:outline-none" />
                          <button className="h-8 rounded-md bg-raised px-3 text-[13px] text-foreground hover:bg-accent">Unlock</button>
                        </form>
                      ) : (
                        <p className="font-mono text-[12px] text-muted-foreground">{s.kind === "image" ? "photo · 1 page" : `${s.pages} page${s.pages > 1 ? "s" : ""}`} · {fmt(s.size)}</p>
                      )}
                      {s.kind === "pdf-locked" && <p className={cn("mt-1 text-[12px]", s.wrong ? "text-fail" : "text-muted-foreground")}>{s.wrong ? "Wrong password. Try again." : "Locked. The password stays on this device."}</p>}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button type="button" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-25"><ArrowUp className="size-4" /></button>
                      <button type="button" aria-label={`Move ${s.name} down`} disabled={i === sources.length - 1} onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-25"><ArrowDown className="size-4" /></button>
                      <button type="button" aria-label={`Remove ${s.name}`} onClick={() => remove(s)} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-fail"><X className="size-4" /></button>
                    </div>
                  </li>
                ))}
              </ol>
              <button type="button" onClick={() => input.current?.click()}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-[14px] text-muted-foreground hover:bg-panel hover:text-foreground">
                <FilePlus2 className="size-4" /> Add PDFs or photos
              </button>
              {error && <p role="alert" className="mt-3 text-[14px] font-medium text-fail">{error}</p>}
            </div>
          )}
        </section>

        <aside className={cn("flex flex-col border-line bg-panel lg:min-h-0 lg:border-l", done ? "pb-24 lg:pb-0" : "")}>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <section className="border-b border-line px-5 py-5">
              <h2 className="mb-3 text-[13px] font-medium text-muted-foreground">Size limit</h2>
              <div className="flex flex-wrap gap-1.5">
                {LIMITS.map((kb) => (
                  <button key={kb} type="button" aria-pressed={limit === kb} onClick={() => pickLimit(kb)}
                    className={cn("h-8 rounded-md border px-2.5 font-mono text-[13px]", limit === kb ? "border-foreground bg-foreground text-canvas" : "border-line-strong text-foreground hover:bg-accent")}>{label(kb)}</button>
                ))}
                <button type="button" aria-pressed={limit === null} onClick={() => pickLimit(null)}
                  className={cn("h-8 rounded-md border px-2.5 text-[13px]", limit === null ? "border-foreground bg-foreground text-canvas" : "border-line-strong text-foreground hover:bg-accent")}>No limit</button>
              </div>
              <label className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                Other
                <input type="number" inputMode="numeric" min={20} placeholder="KB" value={limit !== null && !LIMITS.includes(limit) ? limit : ""}
                  onChange={(e) => { const v = Math.round(Number(e.target.value)); if (v >= 20) pickLimit(v); }}
                  className="h-8 w-24 rounded-md border border-line-strong bg-raised px-2.5 font-mono text-[13px] text-foreground focus:border-ring focus:outline-none" />
                KB
              </label>
              {limit !== null && (
                <div className="mt-4">
                  <SizeMeter spec={{ minKB: 0, maxKB: limit }} result={done ? { bytes: done.bytes.length, fits: true, tooBig: false } : null} target={null} />
                </div>
              )}
            </section>

            <section className="border-b border-line px-5 py-5">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span>
                  <span className="block text-[14px] text-foreground">Rebuild every page</span>
                  <span className="block text-[12px] text-muted-foreground">Fixes "invalid", "corrupted" or "virus" upload errors and removes locks. Text becomes an image.</span>
                </span>
                <Switch checked={rebuild} onCheckedChange={setRebuild} />
              </label>
            </section>

            <section className="border-b border-line px-5 py-5" aria-live="polite">
              <h2 className="mb-2 text-[13px] font-medium text-muted-foreground">Result</h2>
              {busy ? <p className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" /> {progress}</p>
                : done ? (
                  <p className="font-mono text-[12px] text-muted-foreground">
                    {fmt(done.bytes.length)} · {pages} page{pages === 1 ? "" : "s"} · {done.mode === "kept" ? "original pages" : `${done.dpi} DPI · q${Math.round(done.quality! * 100)}`}
                  </p>)
                : <p className="text-[13px] text-muted-foreground">{sources.some((s) => s.kind === "pdf-locked") ? "Unlock the locked PDF to continue." : "Your PDF appears here."}</p>}
              {verdict && <p className={cn("mt-2 text-[14px] font-medium", verdict.tone === "pass" ? "text-pass" : verdict.tone === "warn" ? "text-warn" : "text-fail")}>{verdict.text}</p>}
              {done?.forced && <p className="mt-1 text-[12px] text-muted-foreground">A file was locked or damaged, so its pages were redrawn.</p>}
            </section>

            <footer className="px-5 py-5 text-[12px] leading-relaxed text-muted-foreground">
              Sizes use 1 MB = 1000 KB, the strict reading, so the file passes either way a portal counts.{" "}
              <PrivacyDialog><button type="button" className="text-foreground underline">Privacy</button></PrivacyDialog> · MIT licensed.
            </footer>
          </div>
          <div className="hidden gap-2 border-t border-line p-4 lg:flex">{download}{preview}</div>
        </aside>
      </main>

      {sources.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-line bg-panel px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">{download}{preview}</div>
      )}
    </div>
  );
}
