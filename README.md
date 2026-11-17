# PortalPic

Resize photos and signatures to the exact pixel size and KB limit that exam and visa portals require. Everything runs in your browser, so your ID photos and signatures never leave your device.

**→ [rishikhesh.github.io/portalpic](https://rishikhesh.github.io/portalpic/)**

## Why

Application portals reject uploads that are a few KB off, so people end up uploading passports and signatures to ad-filled resizer sites ([example](https://reddit.com/comments/1xnhggs)). PortalPic does the same job offline, with presets checked against the official notifications.

## What it does

- **Presets** for IBPS, SSC, UPSC, RRB, NEET, JEE Main, CUET, GATE, PAN (NSDL/UTIITSL), the US DS-160 and US passport renewal, plus a custom size.
- **Hits the exact KB range.** It binary-searches for the highest JPEG quality under the maximum. If the result is below the minimum, it first tries full quality, then pads the file with invisible JPEG comment bytes; the pixels are unchanged.
- **Crop, zoom and rotate** to fit the required shape, plus a clean-paper filter for signatures and thumb impressions.
- **Sets DPI** in the file header where a portal asks for it (IBPS thumb and declaration, PAN, RRB).
- **Strips EXIF metadata,** including GPS location.

## Presets

All presets are in [`presets.js`](presets.js), each linked to its source. "Suggested" sizes are the ones we picked where a portal gives only a range or a KB limit. SSC and RRB photos are now taken live by webcam, so those portals only have signature presets.

**Portals change their rules.** If a preset is wrong or missing, open an issue or PR with a link to the official notification.

## Develop

No build step: open `index.html` through any static server.

```sh
bunx serve .     # http://localhost:3000
bun test         # compression and padding tests
```

## License

MIT
