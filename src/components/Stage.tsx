import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { ImagePlus, RotateCw, ZoomIn, ZoomOut, Replace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Area } from "@/lib/process";
import { cn } from "@/lib/utils";
import { PrivacyDialog } from "@/components/PrivacyDialog";

type Props = {
  src: string | null;
  aspect: number;
  outW: number;
  outH: number;
  rotation: number;
  error: string | null;
  onFile: (f: File) => void;
  onArea: (a: Area) => void;
  onRotate: () => void;
};

const toolBtn = "grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

export function Stage({ src, aspect, outW, outH, rotation, error, onFile, onArea, onRotate }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const [over, setOver] = useState(false);

  const pick = () => input.current?.click();
  const take = (f?: File | null) => { if (f) { setCrop({ x: 0, y: 0 }); setZoom(1); onFile(f); } };
  const drop = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); },
  };

  return (
    <div {...drop} className={cn("canvas-grid relative h-full min-h-[340px] overflow-hidden", over && "outline-2 -outline-offset-8 outline-dashed outline-ring")}>
      <input ref={input} type="file" accept="image/*" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />

      {!src ? (
        <div className="grid h-full place-items-center px-6 py-14 text-center">
          <div className="flex max-w-[22rem] flex-col items-center">
            <div className="mb-5 grid size-14 place-items-center rounded-xl border border-line-strong bg-panel text-muted-foreground">
              <ImagePlus className="size-6" strokeWidth={1.6} />
            </div>
            <h2 className="text-[19px] font-semibold tracking-[-0.01em]">Drop a photo or signature</h2>
            <p className="mt-1.5 text-[14px] text-muted-foreground">It's resized and compressed here, in your browser. Nothing is uploaded or saved.{" "}
              <PrivacyDialog><button type="button" className="text-foreground underline">How we know</button></PrivacyDialog></p>
            <Button onClick={pick} className="mt-6 h-11 rounded-md px-5 text-[15px] font-semibold">Choose image</Button>
            <p className="mt-3 font-mono text-[12px] text-muted-foreground">JPG · PNG · HEIC from iPhone Photos · or paste</p>
            {error && <p role="alert" className="mt-4 text-[14px] font-medium text-fail">{error}</p>}
          </div>
        </div>
      ) : (
        <>
          <Cropper image={src} crop={crop} zoom={zoom} rotation={rotation} aspect={aspect} minZoom={1} maxZoom={5}
            zoomSpeed={0.25} objectFit="contain" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom} onCropSizeChange={setFrame}
            onCropComplete={(_, px) => onArea(px)}
            style={{
              containerStyle: { bottom: 64 },
              cropAreaStyle: { border: "1px solid rgba(255,255,255,0.9)", color: "rgba(11,12,14,0.74)" },
            }} />
          {frame && (
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[4px] bg-[#2f6bff] px-1.5 py-0.5 font-mono text-[11px] font-medium text-white"
              style={{ top: `calc(50% - 32px + ${frame.height / 2}px + 8px)` }}>
              {outW} × {outH}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 flex h-16 items-center justify-center px-3">
            <div className="flex items-center gap-1 rounded-lg border border-line bg-panel p-1 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)]">
              <button type="button" aria-label="Zoom out" className={toolBtn} onClick={() => setZoom((z) => Math.max(1, z - 0.25))}><ZoomOut className="size-4" /></button>
              <Slider aria-label="Zoom" min={1} max={5} step={0.01} value={[zoom]} onValueChange={([v]) => setZoom(v)} className="w-28 sm:w-40" />
              <button type="button" aria-label="Zoom in" className={toolBtn} onClick={() => setZoom((z) => Math.min(5, z + 0.25))}><ZoomIn className="size-4" /></button>
              <span className="mx-1 h-5 w-px bg-line" />
              <button type="button" aria-label="Rotate 90 degrees" className={toolBtn} onClick={onRotate}><RotateCw className="size-4" /></button>
              <button type="button" aria-label="Replace image" className={toolBtn} onClick={pick}><Replace className="size-4" /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
