import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ArrowLeft, MonitorDown, FileStack } from "lucide-react";
import { PresetCombobox } from "@/components/PresetCombobox";
import { Stage } from "@/components/Stage";
import { Inspector, ResultBar } from "@/components/Inspector";
import { presets, customSpec, isInk, kitFor, faceGuide, type Custom, type Spec } from "@/lib/spec";
import { KitBar } from "@/components/KitBar";
import { Home } from "@/components/Home";
import { Header, Footer, headerLink } from "@/components/Chrome";
import { processImage, loadImage, inkArea, LoadError, Stale, type Area, type Result } from "@/lib/process";
import { cn, plainClick } from "@/lib/utils";
import { HOME_TITLE, heading, pageTitle } from "@/lib/seo";

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const known = (id: string | null | undefined): id is string => !!id && (id === "custom" || presets.some((p) => p.id === id));
/** /ibps-photo opens that preset; anything else is the home page. */
const fromPath = () => { const id = location.pathname.split("/")[1]; return known(id) ? id : null; };
const DEFAULT_CUSTOM: Custom = { w: 200, h: 230, minKB: 20, maxKB: 50 };

export default function App() {
  const [presetId, setPresetId] = useState(fromPath);
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const markDone = useCallback((id: string) => setDone((d) => new Set(d).add(id)), []);
  const install = useInstallPrompt();

  useEffect(() => {
    const onPop = () => setPresetId(fromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Remembered so the home page can offer "Continue with …" next time.
  useEffect(() => { if (presetId) store.set("pp.preset", presetId); }, [presetId]);

  // Home → a form adds a history entry, so Back returns to the list. Switching between forms replaces it.
  const go = useCallback((id: string | null, replace = false) => {
    history[replace ? "replaceState" : "pushState"](null, "", id ? `/${id}` : "/");
    setPresetId(id);
    if (!replace) window.scrollTo(0, 0);
  }, []);
  const home = (e: MouseEvent) => { if (plainClick(e)) { e.preventDefault(); go(null); } };

  const pdf = <a href="/pdf" className={headerLink}><FileStack className="size-4" /> PDF tools</a>;
  const installBtn = install && (
    <button type="button" onClick={install} className={headerLink} title="Install PortalPic: works offline"><MonitorDown className="size-4" /> Install</button>
  );

  if (!presetId) {
    const last = store.get("pp.preset");
    return (
      <div className="flex min-h-svh flex-col">
        <Title text={HOME_TITLE} />
        <Header onHome={home} right={<>{installBtn}{pdf}</>} />
        <Home last={known(last) ? (last === "custom" ? customSpec(DEFAULT_CUSTOM) : presets.find((p) => p.id === last)!) : null} onPick={go} install={install} />
        <div className="mx-auto w-full max-w-5xl sm:px-1"><Footer /></div>
      </div>
    );
  }
  return <Tool presetId={presetId} go={go} home={home} done={done} markDone={markDone} right={<>{installBtn}{pdf}</>} />;
}

function Title({ text }: { text: string }) {
  useEffect(() => { document.title = text; }, [text]);
  return null;
}

type ToolProps = {
  presetId: string;
  go: (id: string | null, replace?: boolean) => void;
  home: (e: MouseEvent) => void;
  done: Set<string>;
  markDone: (id: string) => void;
  right: React.ReactNode;
};

function Tool({ presetId, go, home, done, markDone, right }: ToolProps) {
  const [custom, setCustom] = useState<Custom>(DEFAULT_CUSTOM);
  const specOf = useCallback((id: string): Spec => (id === "custom" ? customSpec(custom) : presets.find((p) => p.id === id)!), [custom]);
  const spec = useMemo(() => specOf(presetId), [specOf, presetId]);

  const [img, setImg] = useState<ImageBitmap | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [clean, setClean] = useState(() => isInk(spec));
  const [targetKB, setTargetKB] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const job = useRef(0);
  const prev = useRef<{ img: ImageBitmap | null; src: string | null; result: Result | null }>({ img: null, src: null, result: null });

  // Release the current image's memory and blob URLs.
  const release = useCallback(() => {
    job.current++;
    prev.current.img?.close();
    if (prev.current.src) URL.revokeObjectURL(prev.current.src);
    if (prev.current.result?.url) URL.revokeObjectURL(prev.current.result.url);
    prev.current = { img: null, src: null, result: null };
  }, []);
  useEffect(() => release, [release]);

  const choosePreset = (id: string) => {
    const next = specOf(id);
    // A face photo is never the right picture for a signature (or the reverse), so start that upload empty.
    if (isInk(next) !== isInk(spec)) { release(); setImg(null); setSrc(null); setResult(null); setArea(null); setBusy(false); setRotation(0); }
    setTargetKB(null); setClean(isInk(next)); setError(null);
    go(id, true);
  };

  const onFile = useCallback(async (f: File) => {
    if (!f.type.startsWith("image/") && !/\.(heic|heif)$/i.test(f.name)) { setError("That isn't a picture. Choose a JPG or PNG."); return; }
    try {
      const { bitmap, url } = await loadImage(f);
      release();
      setError(null); setRotation(0); setArea(null); setResult(null); setBusy(false);
      setImg(bitmap); setSrc(url);
    } catch (e) {
      setError(e instanceof LoadError ? e.message : "This browser can't open that file. Choose a JPG or PNG.");
    }
  }, [release]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => { const f = e.clipboardData?.files[0]; if (f) onFile(f); };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFile]);

  // Re-encode whenever framing, preset, or cleanup changes. Debounced; stale runs are dropped.
  useEffect(() => {
    if (!img || !area) return;
    const id = ++job.current;
    setBusy(true);
    const t = setTimeout(async () => {
      let r: Result;
      try { r = await processImage(img, rotation, area, spec, clean, targetKB, () => id !== job.current, faceGuide(spec) !== null); }
      catch (e) {
        if (e instanceof Stale || id !== job.current) return;
        setBusy(false);
        setError("Couldn't make this file. Try a tighter crop or another picture.");
        return;
      }
      if (id !== job.current) { if (r.url) URL.revokeObjectURL(r.url); return; }
      if (prev.current.result?.url) URL.revokeObjectURL(prev.current.result.url);
      setResult(r);
      setBusy(false);
    }, 160);
    return () => clearTimeout(t);
  }, [img, rotation, area, spec, clean, targetKB]);

  useEffect(() => { prev.current = { img, src, result }; }, [img, src, result]);

  // A signature or thumbprint scan opens already framed on its ink, so it fills the box.
  const ink = isInk(spec), aspect = spec.w / spec.h;
  const trim = useMemo(() => (ink && img ? inkArea(img, aspect) : null), [ink, img, aspect]);

  const kit = kitFor(spec);
  // The next upload this form still needs: the first one after this that hasn't been downloaded yet.
  const at = kit.findIndex((p) => p.id === spec.id);
  const next = [...kit.slice(at + 1), ...kit.slice(0, at)].find((p) => !done.has(p.id)) ?? null;
  const bar = { spec, result, busy, done, next, onNext: choosePreset, onDownloaded: markDone };
  const back = "flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-panel px-3 text-[15px] font-medium hover:bg-accent";

  return (
    <div className="flex min-h-svh flex-col lg:h-svh">
      <Title text={pageTitle(spec)} />
      <Header onHome={home} right={right}>
        <span className="hidden items-center gap-2 lg:flex">
          <a href="/" onClick={home} className={cn(back, "h-10")}><ArrowLeft className="size-4" /> All forms</a>
          <PresetCombobox spec={spec} onChange={choosePreset} className="w-[340px]" />
        </span>
      </Header>

      <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-2 lg:hidden">
        <a href="/" onClick={home} className={back}><ArrowLeft className="size-4" /> Forms</a>
        <PresetCombobox spec={spec} onChange={choosePreset} className="h-11 min-w-0 flex-1" />
      </div>

      <main className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className={cn("flex min-w-0 flex-col lg:h-auto lg:min-h-0", src && "h-[58svh]")}>
          <KitBar kit={kit} spec={spec} done={done} onPick={choosePreset} />
          <div className="min-h-0 flex-1">
            <Stage heading={heading(spec)} face={faceGuide(spec)} ink={ink} spec={spec} src={src} trim={trim} aspect={aspect} outW={spec.w} outH={spec.h} rotation={rotation} error={error}
              onFile={onFile} onArea={setArea} onRotate={() => setRotation((r) => (r + 90) % 360)} />
          </div>
        </div>
        <aside className={cn("flex flex-col border-t border-line bg-canvas lg:min-h-0 lg:border-t-0 lg:border-l lg:border-line-strong", result && "pb-40 lg:pb-0")}>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <Inspector spec={spec} result={result} busy={busy} clean={clean} onClean={setClean} custom={custom} onCustom={setCustom}
              targetKB={targetKB} onTarget={setTargetKB} />
            <Footer />
          </div>
          <ResultBar {...bar} className="hidden border-t border-line-strong bg-panel p-4 lg:block" />
        </aside>
      </main>

      {result && (
        <ResultBar {...bar} className="fixed inset-x-0 bottom-0 z-20 border-t border-line-strong bg-panel px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(20_20_20/0.3)] lg:hidden" />
      )}
    </div>
  );
}

type InstallEvent = Event & { prompt: () => Promise<void> };

// Chrome/Edge/Android offer installation through this event; Safari users use Share → Add to Home Screen.
function useInstallPrompt() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const gone = () => setEvt(null);
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", gone);
    return () => { window.removeEventListener("beforeinstallprompt", on); window.removeEventListener("appinstalled", gone); };
  }, []);
  return evt ? () => { evt.prompt().finally(() => setEvt(null)); } : null;
}
