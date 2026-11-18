import type { ReactNode } from "react";
import { CloudOff, EyeOff, HardDrive, PlaneTakeoff, Code2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { REPO } from "@/lib/links";

// Every claim here must stay true: the CSP in vercel.json (connect-src 'self') stops the page talking to any other site.
const POINTS: { icon: typeof CloudOff; title: string; body: ReactNode }[] = [
  { icon: CloudOff, title: "No uploads, no server", body: "Your photo is cropped, resized and compressed by your own browser. There is no server that receives images. The site is static files and nothing else." },
  { icon: HardDrive, title: "Nothing is saved", body: "Your photo lives only in this tab's memory and is gone when you close it. The only thing remembered on this device is the last form you picked." },
  { icon: EyeOff, title: "Only anonymous counts", body: "We count visits and downloads with cookieless analytics: which page, country and device type. Never your photo, its contents or its size. No accounts, ads or cookies." },
  { icon: ShieldCheck, title: "Locked to this site", body: "The page's security policy stops it from contacting any other website, and nothing in the code sends your photo anywhere." },
  { icon: PlaneTakeoff, title: "Check it yourself", body: "Once this page has loaded, turn on airplane mode. Everything still works, because nothing needs the internet." },
  { icon: Code2, title: "Open source", body: <>Every line of code is public on <a className="text-foreground underline" href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a> under the MIT licence.</> },
];

export function PrivacyDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-line-strong bg-panel sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] tracking-[-0.01em]">Your photo never leaves this device</DialogTitle>
          <DialogDescription>PortalPic runs entirely in your browser.</DialogDescription>
        </DialogHeader>
        <ul className="mt-1 space-y-4">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-pass" />
              <div>
                <p className="text-[14px] font-medium">{title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
