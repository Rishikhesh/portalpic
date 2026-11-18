# PortalPic

Resize photos and signatures to the exact pixel size and KB limit that exam and visa portals require. Everything runs in your browser, so your ID photos and signatures never leave your device.


## Why

Application portals reject uploads that are a few KB off, so people end up uploading passports and signatures to ad-filled resizer sites ([example](https://reddit.com/comments/1xnhggs)). PortalPic does the same job offline, with presets checked against the official notifications.

## What it does

- **Presets** for Indian exams (IBPS, SSC, UPSC, RRB, NEET, JEE Main, CUET, GATE), PAN (NSDL/UTIITSL), Indian e-Visa, visa and OCI, and visa or passport uploads for the US, UK, Canada, Australia, China, Singapore, Ireland and New Zealand, plus a custom size.
- **Target file size:** optionally aim for a specific size inside the allowed range.
- **Hits the exact KB range.** It binary-searches for the highest JPEG quality under the maximum. If the result is below the minimum, it first tries full quality, then pads the file with invisible JPEG comment bytes; the pixels are unchanged.
- **Crop, zoom and rotate** to fit the required shape, plus a clean-paper filter for signatures and thumb impressions.
- **Sets DPI** in the file header where a portal asks for it (IBPS thumb and declaration, PAN, RRB).
- **Strips EXIF metadata,** including GPS location.
- **Safe with huge files:** it reads the image size from the file header and refuses anything over 64 megapixels or 60 MB before decoding, so a small file that expands to gigabytes can't crash the tab.
- **Nothing can be uploaded:** the Content Security Policy in [`vercel.json`](vercel.json) sets `connect-src 'none'`, so the page cannot send data anywhere.

## Presets

All presets are in [`src/lib/presets.ts`](src/lib/presets.ts), each linked to its official source. "Suggested" sizes are the ones we picked where a portal gives only a range or a KB limit. SSC and RRB photos are now taken live by webcam, so those portals only have signature presets.

**Portals change their rules.** To request a preset, use the [request form](https://forms.gle/gWTPthBeRC2ScrZy9) (no account needed) or [open an issue](https://github.com/Rishikhesh/portalpic/issues/new?template=preset-request.yml). Include a link to the official notification.

## Develop

Vite, React, TypeScript (strict), Tailwind and shadcn/ui. Deployed on Vercel.

```sh
bun install      # also turns on the pre-commit hook
bun run dev      # http://localhost:5173
bun run check    # types, lint, tests and build: runs before every commit and every Vercel deploy
```

## License

MIT
