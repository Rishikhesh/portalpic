import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** True for an ordinary left click, so links can still be opened in a new tab the usual ways. */
export const plainClick = (e: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; button: number }) =>
  !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button);
