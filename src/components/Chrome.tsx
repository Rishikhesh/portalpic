import { useState, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Moon, ShieldCheck, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { REPO, REQUEST_FORM_URL, requestPresetUrl } from "@/lib/links";

// Light or dark. Follows the device until the visitor picks; the pick is kept in localStorage (public/theme.js reads it before paint).
function ThemeToggle() {
  const [dark, setDark] = useState(() => (document.documentElement.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark");
  const flip = (e: MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement, next = dark ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem("pp.theme", next); } catch { /* private mode */ }
      flushSync(() => setDark(next === "dark")); // the new icon must be in the snapshot the circle reveals
    };
    if (!("startViewTransition" in document) || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
    // The new look opens as a circle from this button until it covers the farthest corner.
    const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add("theme-vt");
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 1000, easing: "cubic-bezier(0.76, 0, 0.24, 1)", pseudoElement: "::view-transition-new(root)" },
    ));
    vt.finished.finally(() => root.classList.remove("theme-vt"));
  };
  const label = dark ? "Light" : "Dark";
  return (
    <button type="button" onClick={flip} aria-label={`Switch to ${label.toLowerCase()} mode`} title={`Switch to ${label.toLowerCase()} mode`}
      className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-md px-2 text-[14px] font-medium hover:bg-accent">
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />} <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/** The masthead shared by every page. `onHome` lets the photo tool go home without a page reload. */
export function Header({ onHome, children, right, compact }: { onHome?: (e: MouseEvent) => void; children?: ReactNode; right?: ReactNode; compact?: boolean }) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b-4 border-double border-line-strong bg-canvas px-4">
      <a href="/" onClick={onHome} className="flex items-center gap-2 font-display text-[19px] leading-none font-extrabold tracking-[-0.01em]">
        <Logo /> PortalPic
      </a>
      {children}
      <div className="ml-auto flex items-center gap-1 max-sm:gap-0">
        <ThemeToggle />
        <PrivacyDialog>
          <button type="button" className="flex h-9 items-center gap-1.5 rounded-md px-2 text-[14px] font-medium hover:bg-accent">
            <ShieldCheck className="size-[18px]" /> {compact ? <><span className="sm:hidden">Private</span><span className="max-sm:hidden">Stays on your device</span></> : "Stays on your device"}
          </button>
        </PrivacyDialog>
        {right}
      </div>
    </header>
  );
}

export const headerLink = "hidden h-9 items-center gap-1.5 rounded-md px-2 text-[14px] font-medium hover:bg-accent sm:flex";

export function Footer({ children }: { children?: ReactNode }) {
  return (
    <footer className="px-4 py-6 text-[14px] leading-relaxed text-muted-foreground sm:px-5">
      {children}
      Portals change their rules, so check your official notification before you upload. Need another form or country?{" "}
      {REQUEST_FORM_URL && <><a className="link-pen" href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer">Request it</a> (no account needed) or{" "}</>}
      <a className="link-pen" href={requestPresetUrl()} target="_blank" rel="noopener noreferrer">{REQUEST_FORM_URL ? "open a GitHub issue" : "Request it"}</a>. Found a wrong rule?{" "}
      <a className="link-pen" href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">Report it</a>.
      <span className="mt-2 block">
        <PrivacyDialog><button type="button" className="link-pen">Privacy</button></PrivacyDialog> ·{" "}
        <a className="link-pen" href="/pdf">PDF tools</a> ·{" "}
        <a className="link-pen" href={REPO} target="_blank" rel="noopener noreferrer">Source code</a> · MIT licensed
      </span>
    </footer>
  );
}
