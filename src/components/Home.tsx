import { useState, type MouseEvent } from "react";
import { ArrowRight, MonitorDown, Ruler, Search } from "lucide-react";
import { groups, type Spec } from "@/lib/spec";
import { range } from "@/lib/seo";
import { plainClick } from "@/lib/utils";
import { REQUEST_FORM_URL, requestPresetUrl } from "@/lib/links";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { Example, Pages } from "@/components/Art";
import { Tick } from "@/components/Marks";

const cell = "border-r border-b border-line-strong bg-panel p-3.5";
const row = "-mx-1.5 flex min-h-[52px] items-center gap-3 rounded-sm px-1.5 text-[17px] text-pen hover:bg-accent";
const SAMPLE = { id: "sample", label: "Photo", w: 200, h: 230 };

export function Home({ last, onPick, install }: { last: Spec | null; onPick: (id: string) => void; install: (() => void) | null }) {
  const [q, setQ] = useState("");
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const match = (p: Spec) => { const hay = `${p.group} ${p.label} ${p.id}`.toLowerCase(); return terms.every((t) => hay.includes(t)); };
  const shown = Object.entries(groups).map(([g, list]) => [g, list.filter(match)] as const).filter(([, list]) => list.length);
  const wantsPdf = !terms.length || terms.every((t) => "pdf merge join compress combine document marksheet certificate".includes(t));
  const go = (id: string) => (e: MouseEvent) => { if (plainClick(e)) { e.preventDefault(); onPick(id); } };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-7 pb-4 sm:px-6 sm:pt-10">
      <div className="flex items-center gap-4 sm:gap-12">
        <h1 className="min-w-0 flex-1 sm:flex-none text-[30px] leading-[1.1] font-extrabold tracking-[-0.015em] text-balance sm:text-[40px]">What are you applying for?</h1>
        {/* What the site does, as a picture: a big photo goes in, the right small one comes out. */}
        <div aria-hidden className="flex shrink-0 items-end gap-1.5 sm:my-5 sm:origin-left sm:scale-150 text-center text-[14px] font-semibold text-muted-foreground">
          <div><Example spec={SAMPLE} maxW={64} maxH={74} /><span className="mt-1 block">3 MB</span></div>
          <ArrowRight className="mb-9 size-4 text-foreground" />
          <div className="relative">
            <Example spec={SAMPLE} maxW={40} maxH={46} />
            <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full border border-line-strong bg-panel"><Tick className="size-3.5" /></span>
            <span className="mt-1 block text-pen">30 KB</span>
          </div>
        </div>
      </div>
      <p className="mt-3 max-w-[60ch] text-[16px] text-muted-foreground">
        Choose your form below. PortalPic makes your photo or signature the exact size it asks for. Your photo never leaves this device.{" "}
        <PrivacyDialog><button type="button" className="link-pen">How we know</button></PrivacyDialog>
      </p>

      <label className="mt-5 flex h-14 items-center gap-2.5 border border-line-strong bg-panel px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-pen">
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <span className="sr-only">Search forms</span>
        <input type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: IBPS, SSC, US visa…"
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] placeholder:text-muted-foreground focus:outline-none" />
      </label>

      {last && !q && (
        <a href={`/${last.id}`} onClick={go(last.id)} className="mt-3 flex min-h-14 items-center gap-2 border border-line-strong bg-hl px-3.5 text-[17px] hover:brightness-95">
          <span className="flex-1">Continue with <strong className="font-semibold">{last.group === "Custom" ? "your custom size" : `${last.group} ${last.label.toLowerCase()}`}</strong></span>
          <ArrowRight className="size-5 shrink-0" />
        </a>
      )}

      {/* Documents are the other half of most applications, so the PDF tool sits above the forms, not under them. */}
      {wantsPdf && (
        <a href="/pdf" className="mt-3 flex min-h-[72px] items-center gap-3.5 border border-line-strong bg-panel px-3.5 py-2 text-pen hover:bg-accent">
          <span className="block h-[52px] w-[44px] shrink-0"><Pages /></span>
          <span className="min-w-0 flex-1 leading-snug">
            <span className="block text-[17px] font-medium">Merge or compress a PDF</span>
            <span className="block text-[14px] text-muted-foreground">Marksheets, certificates and ID proof, under the portal's KB limit</span>
          </span>
          <ArrowRight className="size-5 shrink-0" />
        </a>
      )}

      <ul className="mt-5 grid border-t border-l border-line-strong sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(([g, list]) => (
          <li key={g} className={cell}>
            <h2 className="text-[20px] leading-tight font-bold">{g}</h2>
            <ul className="mt-1.5">
              {list.map((p) => (
                <li key={p.id}>
                  <a href={`/${p.id}`} onClick={go(p.id)} className={row}>
                    <span className="grid size-9 shrink-0 place-items-center"><Example spec={p} maxW={36} maxH={36} /></span>
                    <span className="min-w-0 flex-1 py-2 leading-snug">
                      <span className="block font-medium">{p.label}</span>
                      <span className="hidden text-[14px] text-muted-foreground min-[440px]:block">{p.w}×{p.h} · {range(p)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {!shown.length && !(q && wantsPdf) && (
          <li className={`${cell} sm:col-span-2 lg:col-span-3`}>
            <h2 className="text-[20px] leading-tight font-bold">No form matches “{q.trim()}”</h2>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Use a custom size below, or{" "}
              <a className="link-pen" href={REQUEST_FORM_URL || requestPresetUrl(q)} target="_blank" rel="noopener noreferrer">ask us to add this form</a>.
            </p>
          </li>
        )}
        <li className={cell}>
          <h2 className="text-[20px] leading-tight font-bold">Something else</h2>
          <ul className="mt-1.5">
            <li>
              <a href="/custom" onClick={go("custom")} className={row}>
                <Ruler className="mx-1.5 size-6 shrink-0" strokeWidth={1.6} />
                <span className="min-w-0 flex-1 py-2 leading-snug">
                  <span className="block font-medium">Custom size</span>
                  <span className="block text-[14px] text-muted-foreground">any pixels and KB</span>
                </span>
              </a>
            </li>
            {install && (
              <li>
                <button type="button" onClick={install} className={`${row} w-[calc(100%+12px)] text-left`}>
                  <MonitorDown className="mx-1.5 size-6 shrink-0" strokeWidth={1.6} />
                  <span className="min-w-0 flex-1 py-2 leading-snug">
                  <span className="block font-medium">Install PortalPic</span>
                  <span className="block text-[14px] text-muted-foreground">works offline</span>
                </span>
                </button>
              </li>
            )}
          </ul>
        </li>
      </ul>
    </main>
  );
}
