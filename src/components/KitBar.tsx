import { Check } from "lucide-react";
import type { Spec } from "@/lib/spec";
import { cn } from "@/lib/utils";

// Every upload the chosen exam asks for, as tabs. A tick marks the ones downloaded in this visit.
export function KitBar({ kit, spec, done, onPick }: { kit: Spec[]; spec: Spec; done: Set<string>; onPick: (id: string) => void }) {
  if (!kit.length) return null;
  const finished = kit.filter((p) => done.has(p.id)).length;
  return (
    <nav aria-label={`${spec.group} uploads`} className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
      <span className="hidden shrink-0 pl-1 text-[13px] text-muted-foreground sm:block">
        {spec.group} needs <span className="text-foreground">{kit.length} uploads</span>
        {finished > 0 && <span className="font-mono text-[12px]"> · {finished}/{kit.length} done</span>}
      </span>
      <div className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none] sm:justify-end">
        {kit.map((p) => {
          const active = p.id === spec.id, ok = done.has(p.id);
          return (
            <button key={p.id} type="button" onClick={() => onPick(p.id)} aria-current={active ? "step" : undefined}
              className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[13px] whitespace-nowrap transition-colors",
                active ? "border-line-strong bg-raised text-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground")}>
              {ok ? <Check className="size-3.5 text-pass" aria-label="downloaded" /> : <span className={cn("size-1.5 rounded-full", active ? "bg-foreground" : "bg-line-strong")} />}
              {p.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
