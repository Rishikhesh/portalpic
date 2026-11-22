import { useState } from "react";
import { Check, ChevronsUpDown, CircleDot, MessageSquarePlus } from "lucide-react";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { groups, type Spec } from "@/lib/spec";
import { cn } from "@/lib/utils";
import { range } from "@/lib/seo";
import { REQUEST_FORM_URL, requestPresetUrl } from "@/lib/links";

export function PresetCombobox({ spec, onChange, className }: { spec: Spec; onChange: (id: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pick = (id: string) => { onChange(id); setOpen(false); };
  const visit = (url: string) => { window.open(url, "_blank", "noopener,noreferrer"); setOpen(false); };
  const what = search.trim() ? ` for “${search.trim()}”` : "…";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" role="combobox" aria-expanded={open} aria-label="Choose form and field"
          className={cn("flex h-10 items-center gap-2 rounded-md border border-line-strong bg-panel pr-2.5 pl-3 text-left transition-colors hover:bg-accent", className)}>
          <span className="min-w-0 flex-1 truncate">
            <span className="text-muted-foreground">{spec.group}</span>
            <span className="mx-1.5 text-muted-foreground">/</span>
            <span className="font-semibold text-foreground">{spec.label}</span>
          </span>
          <span className="hidden text-[14px] text-muted-foreground sm:inline">{spec.w}×{spec.h}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[min(420px,calc(100vw-24px))] overflow-hidden border-line-strong bg-popover p-0">
        <Command className="bg-transparent" filter={(value, search) => {
          const hay = value.toLowerCase();
          return search.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t)) ? 1 : 0;
        }}>
          <CommandInput value={search} onValueChange={setSearch} placeholder="Search: ssc signature, ds-160, neet…" className="h-11 text-[15px]" />
          <CommandList className="max-h-[min(60vh,440px)]">
            {Object.entries(groups).map(([g, list]) => (
              <CommandGroup key={g} heading={g}>
                {list.map((p) => (
                  <CommandItem key={p.id} value={`${p.group} ${p.label} ${p.id}`} onSelect={() => pick(p.id)} className="gap-3 py-2.5">
                    <Check className={cn("size-4", p.id === spec.id ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1">{p.label}</span>
                    <span className="text-[14px] text-muted-foreground">{p.w}×{p.h} · {range(p)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandGroup heading="Other">
              <CommandItem value={`custom size other ${search}`} onSelect={() => pick("custom")} className="gap-3 py-2.5">
                <Check className={cn("size-4", spec.id === "custom" ? "opacity-100" : "opacity-0")} />
                Custom size…
              </CommandItem>
              {REQUEST_FORM_URL && (
                <CommandItem value={`request preset form ${search}`} onSelect={() => visit(REQUEST_FORM_URL)} className="gap-3 py-2.5">
                  <MessageSquarePlus className="size-4 text-muted-foreground" />
                  <span className="flex-1">Request a preset{what}</span>
                  <span className="text-[14px] text-muted-foreground">No account</span>
                </CommandItem>
              )}
              <CommandItem value={`request preset github issue ${search}`} onSelect={() => visit(requestPresetUrl(search))} className="gap-3 py-2.5">
                <CircleDot className="size-4 text-muted-foreground" />
                <span className="flex-1">{REQUEST_FORM_URL ? "Or open a GitHub issue" : `Request a preset${what}`}</span>
                <span className="text-[14px] text-muted-foreground">GitHub</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
