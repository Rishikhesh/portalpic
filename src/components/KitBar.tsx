import { useEffect, useRef } from "react";
import type { Spec } from "@/lib/spec";
import { cn } from "@/lib/utils";
import { Tick } from "@/components/Marks";

// Every upload the chosen form asks for, as stops on one line. The current stop is highlighted; a tick marks the ones downloaded in this visit.
export function KitBar({ kit, spec, done, onPick }: { kit: Spec[]; spec: Spec; done: Set<string>; onPick: (id: string) => void }) {
  const current = useRef<HTMLButtonElement>(null);
  // On a phone the line is wider than the screen: keep the current stop in view.
  useEffect(() => { current.current?.scrollIntoView({ inline: "center", block: "nearest" }); }, [spec.id]);
  if (!kit.length) return null;
  const at = kit.findIndex((p) => p.id === spec.id);
  const finished = kit.filter((p) => done.has(p.id)).length;
  return (
    <nav aria-label={`${spec.group} uploads`} className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-canvas pl-4 sm:gap-3 sm:pr-4">
      <span className="shrink-0 text-[14px] font-medium text-muted-foreground sm:hidden">{at + 1} of {kit.length}</span>
      <span className="hidden shrink-0 text-[14px] text-muted-foreground sm:block">
        {spec.group} needs {kit.length} uploads{finished > 0 && ` · ${finished} done`}
      </span>
      <ol className="flex min-w-0 flex-1 items-center overflow-x-auto px-4 [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] sm:justify-end sm:px-0 sm:[mask-image:none]">
        {kit.map((p, i) => {
          const active = p.id === spec.id, ok = done.has(p.id);
          return (
            <li key={p.id} className="flex shrink-0 items-center">
              {i > 0 && <span aria-hidden className="h-px w-3 bg-line-strong sm:w-5" />}
              <button type="button" ref={active ? current : undefined} onClick={() => onPick(p.id)} aria-current={active ? "step" : undefined}
                className={cn("flex h-11 items-center gap-1.5 rounded-sm px-2.5 text-[15px] whitespace-nowrap transition-colors",
                  active ? "bg-hl font-semibold" : "hover:bg-accent")}>
                {ok ? <><Tick className="size-4" /><span className="sr-only">Downloaded:</span></>
                  : <span aria-hidden className={cn("size-2.5 rounded-full border-[1.5px] border-line-strong", active && "bg-line-strong")} />}
                {p.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
