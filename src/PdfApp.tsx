import { useCallback, useEffect, useRef, useState } from "react";
import { pageview } from "@vercel/analytics";
import { ArrowDown, ArrowUp, ChevronDown, CircleCheck, CircleX, Download, Eye, FilePlus2, ImageIcon, LoaderCircle, Lock, RotateCw, TriangleAlert, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Chrome";
import { Pages } from "@/components/Art";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { SizeMeter } from "@/components/Inspector";
import { maxBytes } from "@/lib/compress";
import { allPages, build, closeSource, openSource, pageThumb, OpenError, Stale, type Built, type Pick, type Source } from "@/lib/pdf/raster";
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

const rowBtn = "grid size-10 place-items-center rounded-sm text-foreground hover:bg-accent disabled:opacity-25";
const turned = (p: Pick): Pick => ({ ...p, rot: (p.rot + 90) % 360 });

/** The pages of one PDF as they will appear in the result: turn, reorder or remove each. */
// ponytail: pages move only inside their own file, and every thumbnail is drawn when the list opens.
// Make it one flat list across files if people need to interleave them; draw thumbnails on scroll if 200-page files get slow.
function PageList({ doc, pages, picks, onPicks }: { doc: Parameters<typeof pageThumb>[0]; pages: number; picks: Pick[]; onPicks: (p: Pick[]) => void }) {
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const made = useRef<Record<number, string>>({});
  useEffect(() => {
    let live = true;
    void (async () => {
      for (let no = 1; no <= pages && live; no++) {
        if (made.current[no]) continue;
        const url = await pageThumb(doc, no).catch(() => "");
        if (!live) { if (url) URL.revokeObjectURL(url); return; }
        made.current[no] = url; setThumbs({ ...made.current });
      }
    })();
    return () => { live = false; };
  }, [doc, pages]);
  useEffect(() => { const all = made.current; return () => Object.values(all).forEach((u) => u && URL.revokeObjectURL(u)); }, []);

  const swap = (k: number, d: number) => { const c = [...picks]; [c[k], c[k + d]] = [c[k + d], c[k]]; onPicks(c); };
  const changed = picks.length !== pages || picks.some((p, k) => p.no !== k + 1 || p.rot);
  return (
    <div className="mt-2.5 border-t border-line pt-2">
      <ol className="space-y-1">
        {picks.map((p, k) => (
          <li key={p.no} className="flex items-center gap-3">
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden border border-line bg-raised">
              {thumbs[p.no] && <img src={thumbs[p.no]} alt="" className="max-h-full max-w-full transition-transform duration-200" style={{ transform: `rotate(${p.rot}deg)` }} />}
            </div>
            <span className="min-w-0 flex-1 text-[14px]">Page {p.no}</span>
            <div className="flex shrink-0 items-center">
              <button type="button" aria-label={`Turn page ${p.no}`} title="Turn" onClick={() => onPicks(picks.map((x, j) => (j === k ? turned(x) : x)))} className={rowBtn}><RotateCw className="size-4" /></button>
              <button type="button" aria-label={`Move page ${p.no} up`} disabled={k === 0} onClick={() => swap(k, -1)} className={rowBtn}><ArrowUp className="size-4" /></button>
              <button type="button" aria-label={`Move page ${p.no} down`} disabled={k === picks.length - 1} onClick={() => swap(k, 1)} className={rowBtn}><ArrowDown className="size-4" /></button>
              <button type="button" aria-label={`Remove page ${p.no}`} title="Remove" onClick={() => onPicks(picks.filter((_, j) => j !== k))} className={cn(rowBtn, "hover:text-fail")}><X className="size-4" /></button>
            </div>
          </li>
        ))}
      </ol>
      {changed && <button type="button" onClick={() => onPicks(allPages(pages))} className="link-pen mt-2 text-[14px]">Put all {pages} pages back as they were</button>}
    </div>
  );
}

export default function PdfApp() {
  const [sources, setSources] = useState<Source[]>([]);
  const [limit, setLimit] = useState<number | null>(() => { const v = store.get("pp.pdfLimit"); return v === "none" ? null : Number(v) || 1000; });
  const [rebuild, setRebuild] = useState(false);
  const [out, setOut] = useState<Output | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null); // the file whose pages are being edited
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
  // Removing a file's last page removes the file.
  const setPicks = (s: Source, picks: Pick[]) => (picks.length ? setSources((l) => l.map((x) => (x.id === s.id ? { ...x, picks } : x))) : remove(s));
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

  const pages = sources.reduce((n, s) => n + s.picks.length, 0);
  const busy = progress !== null;
  const done = out && "url" in out && !busy ? out : null;
  const name = `${(sources[0]?.name ?? "document").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").toLowerCase() || "document"}${sources.length > 1 ? "-merged" : ""}.pdf`;
  const verdict = !out || busy ? null
    : "tooBig" in out ? { tone: "fail", text: `Can't get this under ${label(limit!)} and keep it readable. Remove pages, or split it into two files.` }
    : out.mode === "kept" ? { tone: "pass", text: out.forced ? "Ready to upload." : "Ready to upload. Text stays sharp." }
    : out.mode === "shrunk" ? (out.quality! <= 0.4
      ? { tone: "warn", text: "Fits. Text and highlights are untouched, but pictures were compressed hard. Open the preview to check them." }
      : { tone: "pass", text: "Ready to upload. Only the pictures inside were compressed." })
    : !rebuild ? { tone: "warn", text: "Fits only by turning pages into images, so text can't be selected or searched. A higher limit keeps it a real PDF." }
    : (out.dpi! <= 72 || out.quality! < 0.3) ? { tone: "warn", text: "Fits, but small text may be hard to read. Open the preview to check." }
    : { tone: "pass", text: "Ready to upload. Every page was redrawn as a clean image." };

  const download = (
    <a href={done?.url} download={done ? name : undefined} aria-disabled={!done}
      onClick={() => pageview({ route: "/_download/[preset]", path: "/_download/pdf" })}
      className="btn-pen flex-1">
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
      {busy ? "Working…" : "Download PDF"}
    </a>
  );
  const preview = done && (
    <a href={done.url} target="_blank" rel="noopener" className="btn-box shrink-0" title="Open the PDF to check it">
      <Eye className="size-4" /> Preview
    </a>
  );

  const locked = sources.some((s) => s.kind === "pdf-locked");
  const tone = verdict ? { pass: "text-pass", warn: "text-warn", fail: "text-fail" }[verdict.tone] : "text-muted-foreground";
  const Mark = verdict ? { pass: CircleCheck, warn: TriangleAlert, fail: CircleX }[verdict.tone] : null;
  // The verdict and the action it leads to, kept together: same bar as the photo tool.
  const bar = (className: string) => (
    <div className={className}>
      <p aria-live="polite" className={cn("mb-2.5 flex items-start gap-2 text-[17px] leading-snug font-semibold", tone)}>
        {busy ? <LoaderCircle className="mt-[2px] size-5 shrink-0 animate-spin" /> : Mark && <Mark className="mt-[2px] size-5 shrink-0" />}
        <span>
          {busy ? progress : verdict ? verdict.text : locked ? "Unlock the locked PDF to continue." : "Add your files to make one PDF."}
          {done && verdict?.tone !== "fail" && <span className="font-normal text-foreground"> {fmt(done.bytes.length)}, {pages} page{pages === 1 ? "" : "s"}.</span>}
        </span>
      </p>
      <div className="flex gap-2">{download}{preview}</div>
    </div>
  );

  return (
    <div className="flex min-h-svh flex-col lg:h-svh">
      <Header compact right={<a href="/" className="flex h-9 items-center gap-1.5 rounded-md px-2 text-[14px] font-medium hover:bg-accent"><ImageIcon className="size-4" /> Photo<span className="hidden sm:inline"> & signature</span></a>}>
        <span className="hidden text-[14px] text-muted-foreground sm:inline">PDF tools</span>
      </Header>

      <main className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0 lg:min-h-0 lg:overflow-y-auto"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void add(e.dataTransfer.files); }}>
          <input ref={input} type="file" multiple accept="application/pdf,.pdf,image/*" onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ""; }} />
          {sources.length === 0 ? (
            <div className="grid min-h-[60svh] place-items-center px-6 py-14 text-center lg:h-full">
              <div className="flex max-w-[26rem] flex-col items-center">
                <div className="mb-3 h-[132px] w-[114px]"><Pages /></div>
                <h1 className="text-[26px] leading-tight font-bold text-balance">Merge and compress PDFs for upload portals</h1>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  Combine PDFs and photos into one file under the portal's size limit, and fix "invalid PDF" errors. It all happens in your browser; nothing is uploaded.{" "}
                  <PrivacyDialog><button type="button" className="link-pen">How we know</button></PrivacyDialog>
                </p>
                <button type="button" onClick={() => input.current?.click()} className="btn-pen mt-5 w-full">Choose files</button>
                <p className="mt-3 text-[14px] text-muted-foreground">PDF, JPG, PNG or HEIC. Several at once is fine.</p>
                {error && <p role="alert" className="mt-4 text-[14px] font-medium text-fail">{error}</p>}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl px-4 py-5">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-[20px] font-bold">{sources.length} file{sources.length > 1 ? "s" : ""} · {pages} page{pages === 1 ? "" : "s"}</h1>
                <span className="text-[14px] text-muted-foreground">Joined top to bottom</span>
              </div>
              <ol className="space-y-2">
                {sources.map((s, i) => (
                  <li key={s.id} className="border border-line-strong bg-panel p-2.5">
                    <div className="flex items-center gap-3">
                      <div className="grid size-14 shrink-0 place-items-center overflow-hidden border border-line bg-raised">
                        {s.thumb ? <img src={s.thumb} alt="" className="max-h-full max-w-full transition-transform duration-200" style={{ transform: s.pages === 1 ? `rotate(${s.picks[0].rot}deg)` : undefined }} />
                          : <Lock className="size-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] text-foreground">{s.name}</p>
                        {s.kind === "pdf-locked" ? (
                          <form className="mt-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); void unlock(s, new FormData(e.currentTarget).get("pw") as string); }}>
                            <input name="pw" type="password" autoComplete="off" placeholder="PDF password" aria-label={`Password for ${s.name}`}
                              className="h-9 min-w-0 flex-1 border border-line-strong bg-panel px-2.5 text-[14px]" />
                            <button className="h-9 rounded-md border border-line-strong bg-panel px-3 text-[14px] font-medium hover:bg-accent">Unlock</button>
                          </form>
                        ) : (
                          <p className="text-[14px] text-muted-foreground">
                            {s.kind === "image" ? "photo · 1 page" : s.picks.length === s.pages ? `${s.pages} page${s.pages > 1 ? "s" : ""}` : `${s.picks.length} of ${s.pages} pages`} · {fmt(s.size)}
                          </p>
                        )}
                        {s.kind === "pdf-locked" && <p className={cn("mt-1 text-[14px]", s.wrong ? "text-fail" : "text-muted-foreground")}>{s.wrong ? "Wrong password. Try again." : "Locked. The password stays on this device."}</p>}
                      </div>
                      <div className="flex shrink-0 items-center">
                        <button type="button" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => move(i, -1)} className={rowBtn}><ArrowUp className="size-4" /></button>
                        <button type="button" aria-label={`Move ${s.name} down`} disabled={i === sources.length - 1} onClick={() => move(i, 1)} className={rowBtn}><ArrowDown className="size-4" /></button>
                        <button type="button" aria-label={`Remove ${s.name}`} onClick={() => remove(s)} className={cn(rowBtn, "hover:text-fail")}><X className="size-4" /></button>
                      </div>
                    </div>
                    {s.kind !== "pdf-locked" && (s.pages === 1 ? (
                      <button type="button" onClick={() => setPicks(s, s.picks.map(turned))} className="mt-2 flex h-10 items-center gap-1.5 rounded-md border border-line-strong px-3 text-[14px] font-medium hover:bg-accent">
                        <RotateCw className="size-4" /> Turn
                      </button>
                    ) : (
                      <button type="button" aria-expanded={openId === s.id} onClick={() => setOpenId(openId === s.id ? null : s.id)}
                        className="mt-2 flex h-10 items-center gap-1.5 rounded-md border border-line-strong px-3 text-[14px] font-medium hover:bg-accent">
                        Choose, turn or reorder pages <ChevronDown className={cn("size-4 transition-transform", openId === s.id && "rotate-180")} />
                      </button>
                    ))}
                    {s.kind === "pdf" && openId === s.id && <PageList doc={s.doc} pages={s.pages} picks={s.picks} onPicks={(p) => setPicks(s, p)} />}
                  </li>
                ))}
              </ol>
              <button type="button" onClick={() => input.current?.click()}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 border-[1.5px] border-dashed border-line-strong text-[14px] font-medium text-pen hover:bg-panel">
                <FilePlus2 className="size-4" /> Add PDFs or photos
              </button>
              {error && <p role="alert" className="mt-3 text-[14px] font-medium text-fail">{error}</p>}
            </div>
          )}
        </section>

        <aside className={cn("flex flex-col border-t border-line bg-canvas lg:min-h-0 lg:border-t-0 lg:border-l lg:border-line-strong", sources.length ? "pb-48 lg:pb-0" : "")}>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <section className="border-b border-line px-4 pt-6 pb-5 sm:px-5">
              <h2 className="mb-2.5 text-[19px] leading-tight font-bold">Size limit</h2>
              <div className="flex flex-wrap gap-1.5">
                {LIMITS.map((kb) => (
                  <button key={kb} type="button" aria-pressed={limit === kb} onClick={() => pickLimit(kb)}
                    className={cn("h-10 rounded-md border border-line-strong px-3 text-[14px] font-medium", limit === kb ? "bg-pen font-semibold text-primary-foreground" : "bg-panel hover:bg-accent")}>{label(kb)}</button>
                ))}
                <button type="button" aria-pressed={limit === null} onClick={() => pickLimit(null)}
                  className={cn("h-10 rounded-md border border-line-strong px-3 text-[14px] font-medium", limit === null ? "bg-pen font-semibold text-primary-foreground" : "bg-panel hover:bg-accent")}>No limit</button>
              </div>
              <label className="mt-3 flex items-center gap-2 text-[14px] text-muted-foreground">
                Other
                <input type="number" inputMode="numeric" min={20} placeholder="KB" value={limit !== null && !LIMITS.includes(limit) ? limit : ""}
                  onChange={(e) => { const v = Math.round(Number(e.target.value)); if (v >= 20) pickLimit(v); }}
                  className="h-10 w-24 border border-line-strong bg-panel px-2.5 text-[15px] font-semibold text-pen placeholder:font-normal placeholder:text-muted-foreground" />
                KB
              </label>
              {limit !== null && (
                <div className="mt-4">
                  <SizeMeter spec={{ minKB: 0, maxKB: limit }} result={done ? { bytes: done.bytes.length, fits: true, tooBig: false } : null} target={null} />
                </div>
              )}
            </section>

            <section className="border-b border-line px-4 py-5 sm:px-5">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span>
                  <span className="block text-[15px] font-medium">Rebuild every page</span>
                  <span className="block text-[14px] text-muted-foreground">Fixes "invalid", "corrupted" or "virus" upload errors and removes locks. Text becomes an image.</span>
                </span>
                <Switch checked={rebuild} onCheckedChange={setRebuild} />
              </label>
            </section>

            {done && (
              <section className="border-b border-line px-4 pt-6 pb-5 sm:px-5">
                <h2 className="mb-2.5 text-[19px] leading-tight font-bold">Your PDF</h2>
                <p className="text-[14px] text-muted-foreground">
                  {fmt(done.bytes.length)} · {pages} page{pages === 1 ? "" : "s"} · {done.mode === "kept" ? "original pages" : done.mode === "shrunk" ? "original pages, pictures compressed" : `pages as images, ${done.dpi} DPI`}
                </p>
                {done.forced && done.mode !== "rebuilt" && <p className="mt-1 text-[14px] text-muted-foreground">A locked or damaged file was redrawn as images; the other files kept their text.</p>}
              </section>
            )}

            <footer className="px-4 py-6 text-[14px] leading-relaxed text-muted-foreground sm:px-5">
              Sizes use 1 MB = 1000 KB, the strict reading, so the file passes either way a portal counts.{" "}
              <PrivacyDialog><button type="button" className="link-pen">Privacy</button></PrivacyDialog> · MIT licensed.
            </footer>
          </div>
          {bar("hidden border-t border-line-strong bg-panel p-4 lg:block")}
        </aside>
      </main>

      {sources.length > 0 && (
        bar("fixed inset-x-0 bottom-0 z-20 border-t border-line-strong bg-panel px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(20_20_20/0.3)] lg:hidden")
      )}
    </div>
  );
}
