import type { ReactNode } from "react";
import { CloudOff, EyeOff, HardDrive, PlaneTakeoff, Code2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { REPO } from "@/lib/links";

// Every claim here must stay true: the CSP in vercel.json (connect-src 'self') stops the page talking to any other site.
const POINTS: { icon: typeof CloudOff; title: string; body: ReactNode }[] = [
  { icon: CloudOff, title: "No uploads, no server", body: "Your photos and PDFs are cropped, merged and compressed by your own browser. There is no server that receives files. The site is static files and nothing else." },
  { icon: HardDrive, title: "Nothing is saved", body: "Your files live only in this tab's memory and are gone when you close it. A PDF password is used once, in this tab, and never stored. The only things remembered on this device are the last form, the PDF size limit and the light or dark look you picked." },
  { icon: EyeOff, title: "Only anonymous counts", body: "We count visits and downloads with cookieless analytics: which page, country and device type. Never your files, their names, contents or sizes. No accounts, ads or cookies." },
  { icon: ShieldCheck, title: "Locked to this site", body: "The page's security policy stops it from contacting any other website, and nothing in the code sends your files anywhere." },
  { icon: PlaneTakeoff, title: "Check it yourself", body: "Once this page has loaded, turn on airplane mode. Everything still works, even after a reload, because nothing needs the internet." },
  { icon: Code2, title: "Open source", body: <>Every line of code is public on <a className="link-pen" href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a> under the MIT licence.</> },
];

export function PrivacyDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-line-strong bg-panel sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] leading-tight font-bold">Your files never leave this device</DialogTitle>
          <DialogDescription>PortalPic runs entirely in your browser.</DialogDescription>
        </DialogHeader>
        <ul className="mt-1 space-y-4">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-[15px] font-semibold">{title}</p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
