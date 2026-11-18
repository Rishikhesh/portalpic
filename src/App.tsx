import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PresetCombobox } from "@/components/PresetCombobox";
import { Stage } from "@/components/Stage";
import { Inspector, DownloadButton, message } from "@/components/Inspector";
import { presets, customSpec, isInk, type Custom } from "@/lib/spec";
import { processImage, loadImage, LoadError, Stale, type Area, type Result } from "@/lib/process";
import { cn } from "@/lib/utils";
import { REPO, REQUEST_FORM_URL, requestPresetUrl } from "@/lib/links";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { HOME_TITLE, heading, pagePath, pageTitle } from "@/lib/seo";

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#f2f2f3" />
      <path d="M7 6.5h-.5v3M17 6.5h.5v3M7 17.5h-.5v-3M17 17.5h.5v-3" stroke="#0b0c0e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="10.6" r="2" fill="#0b0c0e" />
      <path d="M8.6 16.4c.6-1.8 1.9-2.7 3.4-2.7s2.8.9 3.4 2.7" fill="#0b0c0e" />
    </svg>
  );
}

export default function App() {
  const [presetId, setPresetId] = useState(() => {
    const fromUrl = location.pathname.split("/")[1]; // /ibps-photo opens that preset
    if (presets.some((p) => p.id === fromUrl)) return fromUrl;
    const last = store.get("pp.preset");
    return last && (last === "custom" || presets.some((p) => p.id === last)) ? last : presets[0].id;
  });
  const [custom, setCustom] = useState<Custom>({ w: 200, h: 230, minKB: 20, maxKB: 50 });
  const spec = useMemo(
    () => (presetId === "custom" ? customSpec(custom) : presets.find((p) => p.id === presetId)!),
    [presetId, custom],
  );

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

  const choosePreset = (id: string) => {
    const next = id === "custom" ? customSpec(custom) : presets.find((p) => p.id === id)!;
    setPresetId(id); store.set("pp.preset", id); setTargetKB(null); setClean(isInk(next));
    history.replaceState(null, "", pagePath(next)); // shareable link to this preset
  };

  useEffect(() => { document.title = location.pathname === "/" ? HOME_TITLE : pageTitle(spec); }, [spec]);

  const onFile = useCallback(async (f: File) => {
    if (!f.type.startsWith("image/") && !/\.(heic|heif)$/i.test(f.name)) { setError("That isn't an image. Choose a JPG or PNG."); return; }
    try {
      const { bitmap, url } = await loadImage(f);
      // Release the previous image's memory and blob URLs before swapping in the new one.
      job.current++;
      prev.current.img?.close();
      if (prev.current.src) URL.revokeObjectURL(prev.current.src);
      if (prev.current.result?.url) URL.revokeObjectURL(prev.current.result.url);
      setError(null); setRotation(0); setArea(null); setResult(null); setBusy(false);
      setImg(bitmap); setSrc(url);
    } catch (e) {
      setError(e instanceof LoadError ? e.message : "This browser can't open that file. Choose a JPG or PNG.");
    }
  }, []);

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
      try { r = await processImage(img, rotation, area, spec, clean, targetKB, () => id !== job.current); }
      catch (e) {
        if (e instanceof Stale || id !== job.current) return;
        setBusy(false);
        setError("Couldn't compress this image. Try a smaller crop or another photo.");
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

  const msg = result ? message(spec, result) : null;

  return (
    <div className="flex min-h-svh flex-col lg:h-svh">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-panel px-4">
        <a href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em]">
          <Logo /> PortalPic
        </a>
        <span className="hidden h-5 w-px bg-line lg:block" />
        <PresetCombobox spec={spec} onChange={choosePreset} className="hidden w-[380px] lg:flex" />
        <div className="ml-auto flex items-center gap-1">
          <PrivacyDialog>
            <button type="button" className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground sm:flex">
              <ShieldCheck className="size-4 text-pass" /> Processed on your device
            </button>
          </PrivacyDialog>
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">
            Source
          </a>
        </div>
      </header>

      <div className="border-b border-line bg-panel px-4 pb-3 lg:hidden">
        <PresetCombobox spec={spec} onChange={choosePreset} className="w-full" />
        <PrivacyDialog>
          <button type="button" className="mt-2 flex items-center gap-1.5 text-left text-[12px] text-muted-foreground sm:hidden">
            <ShieldCheck className="size-3.5 shrink-0 text-pass" /> Processed on your device. Nothing is uploaded. <span className="text-foreground underline">How?</span>
          </button>
        </PrivacyDialog>
      </div>

      <main className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="h-[58svh] lg:h-auto lg:min-h-0">
          <Stage heading={heading(spec)} src={src} aspect={spec.w / spec.h} outW={spec.w} outH={spec.h} rotation={rotation} error={error}
            onFile={onFile} onArea={setArea} onRotate={() => setRotation((r) => (r + 90) % 360)} />
        </div>
        <aside className={cn("flex flex-col border-line bg-panel lg:min-h-0 lg:border-l", result ? "pb-32 lg:pb-0" : "")}>
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <Inspector spec={spec} result={result} busy={busy} clean={clean} onClean={setClean} custom={custom} onCustom={setCustom}
            targetKB={targetKB} onTarget={setTargetKB} />
          <footer className="px-5 py-5 text-[12px] leading-relaxed text-muted-foreground">
            Portals change their rules; check your official notification before uploading. Need another form or country?{" "}
            {REQUEST_FORM_URL && <><a className="text-foreground underline" href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer">Request a preset</a> (no account needed) or{" "}</>}
            <a className="text-foreground underline" href={requestPresetUrl()} target="_blank" rel="noopener noreferrer">{REQUEST_FORM_URL ? "open a GitHub issue" : "Request a preset"}</a>. Found a wrong one?{" "}
            <a className="text-foreground underline" href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">Report it</a>.{" "}
            <PrivacyDialog><button type="button" className="text-foreground underline">Privacy</button></PrivacyDialog> · MIT licensed.
          </footer>
          </div>
          <div className="hidden border-t border-line p-4 lg:block">
            <DownloadButton spec={spec} result={result} busy={busy} className="w-full" />
          </div>
        </aside>
      </main>

      {result && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
          {msg && (
            <p className={cn("mb-2 truncate text-center text-[13px] font-medium",
              msg.tone === "pass" ? "text-pass" : msg.tone === "warn" ? "text-warn" : "text-fail")}>
              {result.tooBig ? msg.text : `${(result.bytes / 1024).toFixed(1)} KB · ${spec.w}×${spec.h} · ${msg.tone === "fail" ? "outside limit" : "within limit"}`}
            </p>
          )}
          <DownloadButton spec={spec} result={result} busy={busy} className="w-full" />
        </div>
      )}
    </div>
  );
}
