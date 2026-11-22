import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { RotateCw, ZoomIn, ZoomOut, Replace, ScanFace } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { Area } from "@/lib/process";
import { cn } from "@/lib/utils";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { Example } from "@/components/Art";
import type { Spec } from "@/lib/spec";

type Props = {
  heading: string;
  /** Chin-to-crown share of the frame for the face guide, or null for signatures. */
  face: number | null;
  /** Signatures, thumbprints and declarations: the words change from "photo" to "scan". */
  ink: boolean;
  spec: Spec;
  src: string | null;
  /** Where the crop should start (source pixels): the ink of a signature scan. Null starts on the whole picture. */
  trim: Area | null;
  aspect: number;
  outW: number;
  outH: number;
  rotation: number;
  error: string | null;
  onFile: (f: File) => void;
  onArea: (a: Area) => void;
  onRotate: () => void;
};

const zoomBtn = "grid size-11 shrink-0 place-items-center rounded-sm transition-colors hover:bg-accent";
// Every tool carries its word: an icon alone is a guess for someone who has never cropped a photo.
const toolBtn = "flex h-[52px] w-[62px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm text-[14px] font-medium transition-colors hover:bg-accent";
const BAR = 76; // height of the tool band under the crop
const MAX_ZOOM = 10; // a signature can be a small part of a full-page scan

export function Stage({ heading, face, ink, spec, src, trim, aspect, outW, outH, rotation, error, onFile, onArea, onRotate }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const [over, setOver] = useState(false);
  const [guide, setGuide] = useState(true);
  const [hint, setHint] = useState(true);

  const pick = () => input.current?.click();
  const take = (f?: File | null) => { if (f) { setCrop({ x: 0, y: 0 }); setZoom(1); setHint(true); onFile(f); } };
  const drop = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); },
  };
  return (
    <div {...drop} className={cn("relative h-full overflow-hidden", src ? "min-h-[340px] bg-raised" : "bg-canvas", over && "outline-2 -outline-offset-8 outline-dashed outline-pen")}>
      <input ref={input} type="file" accept="image/*" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />

      {!src ? (
        <div className="grid h-full place-items-center px-4 py-7 text-center lg:py-14">
          <div className="flex w-full max-w-[24rem] flex-col items-center">
            <button type="button" onClick={pick} tabIndex={-1} aria-hidden className="transition-transform hover:scale-[1.02]">
              <Example spec={spec} maxW={220} maxH={132} className="border-[1.5px]" />
            </button>
            <p className="mt-1.5 text-[14px] text-muted-foreground">{spec.id === "custom" ? `${outW} × ${outH} px` : `Example · ${outW} × ${outH} px`}</p>
            <h1 className="mt-3 text-[26px] leading-tight font-bold text-balance">{heading}</h1>
            <button type="button" onClick={pick} className="btn-pen mt-4 w-full">{ink ? "Choose scan or photo" : "Choose photo"}</button>
            <p className="mt-3 text-[14px] text-muted-foreground">
              It stays on this device. Nothing is uploaded.{" "}
              <PrivacyDialog><button type="button" className="link-pen">How we know</button></PrivacyDialog>
            </p>
            <p className="mt-1 text-[14px] text-muted-foreground">JPG, PNG or iPhone HEIC<span className="hidden lg:inline">. You can also drop or paste it here</span>.</p>
            {error && <p role="alert" className="mt-4 text-[16px] font-semibold text-fail">{error}</p>}
          </div>
        </div>
      ) : (
        <>
          <Cropper key={`${src} ${aspect}`} image={src} crop={crop} zoom={zoom} rotation={rotation} aspect={aspect} minZoom={1} maxZoom={MAX_ZOOM}
            initialCroppedAreaPixels={trim ?? undefined}
            zoomSpeed={0.25} objectFit="contain" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom} onCropSizeChange={setFrame} onInteractionStart={() => setHint(false)}
            onCropComplete={(_, px) => onArea(px)}
            style={{
              containerStyle: { bottom: BAR },
              cropAreaStyle: { border: "1.5px solid var(--line-strong)", color: "var(--veil)" },
            }} />
          {frame && (
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-sm bg-pen px-1.5 py-0.5 text-[14px] font-semibold text-primary-foreground"
              style={{ top: `calc(50% - ${BAR / 2}px + ${frame.height / 2}px + 8px)` }}>
              {outW} × {outH}
            </div>
          )}
          {hint && !(face && guide) && (
            <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-sm border border-line-strong bg-panel px-2 py-1 text-[14px] whitespace-nowrap">
              {trim ? "Trimmed to the ink. Drag or zoom to adjust." : "Drag to move. Pinch or slide to zoom."}
            </p>
          )}

          {frame && face && guide && <FaceGuide w={frame.width} h={frame.height} face={face} />}
          {error && <p role="alert" className="absolute inset-x-3 top-3 border border-fail bg-panel px-3 py-2 text-center text-[14px] font-semibold text-fail">{error}</p>}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center px-2" style={{ height: BAR }}>
            <div className="flex items-center rounded-md border border-line-strong bg-panel p-1 shadow-[0_6px_16px_-8px_rgb(20_20_20/0.4)]">
              <button type="button" aria-label="Zoom out" className={zoomBtn} onClick={() => { setHint(false); setZoom((z) => Math.max(1, z - 0.25)); }}><ZoomOut className="size-5" /></button>
              <Slider aria-label="Zoom" min={1} max={MAX_ZOOM} step={0.01} value={[zoom]} onValueChange={([v]) => { setHint(false); setZoom(v); }} className="w-[56px] sm:w-40" />
              <button type="button" aria-label="Zoom in" className={zoomBtn} onClick={() => { setHint(false); setZoom((z) => Math.min(MAX_ZOOM, z + 0.25)); }}><ZoomIn className="size-5" /></button>
              <span className="mx-1 h-7 w-px bg-line" />
              <button type="button" className={toolBtn} onClick={onRotate}><RotateCw className="size-5" /> Turn</button>
              {face && (
                <button type="button" aria-pressed={guide} title="Show or hide the head outline" onClick={() => setGuide((g) => !g)}
                  className={cn(toolBtn, guide && "bg-accent")}><ScanFace className="size-5" /> Guide</button>
              )}
              <button type="button" onClick={pick} className={toolBtn}><Replace className="size-5" /> Change</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Dashed head outline over the crop frame: chin-to-crown = face × frame height, sitting slightly above centre.
// White under blue, so it shows on both dark hair and a white wall.
function FaceGuide({ w, h, face }: { w: number; h: number; face: number }) {
  const rh = (h * face) / 2, rw = rh * 0.74, cy = h * 0.47;
  const eyes = { x1: w / 2 - rw * 0.75, x2: w / 2 + rw * 0.75, y1: cy - rh * 0.08, y2: cy - rh * 0.08 };
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: `calc(50% - ${BAR / 2}px)`, width: w, height: h }}>
      <svg width={w} height={h} className="overflow-visible" fill="none">
        <ellipse cx={w / 2} cy={cy} rx={rw} ry={rh} stroke="#fff" strokeWidth="3.5" opacity="0.85" />
        <ellipse cx={w / 2} cy={cy} rx={rw} ry={rh} stroke="#1a3fb5" strokeWidth="1.5" strokeDasharray="6 5" />
        <line {...eyes} stroke="#fff" strokeWidth="3" opacity="0.85" />
        <line {...eyes} stroke="#1a3fb5" strokeWidth="1" strokeDasharray="2 4" />
      </svg>
      <span className="absolute left-1/2 -translate-x-1/2 rounded-sm border border-line-strong bg-panel px-1.5 py-0.5 text-[14px] whitespace-nowrap"
        style={{ top: Math.max(4, cy - rh - 28) }}>Drag and zoom until the head fits, eyes on the line</span>
    </div>
  );
}
