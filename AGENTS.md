# Notes for agents

- Run `bun run check` (types, lint, tests, build) before you finish. The pre-commit hook and the Vercel build both run it.
- The photo never leaves the device. The only network traffic is Vercel Web Analytics (cookieless page views and a `download` event with the preset id) to this site's own `/_vercel/insights`. The CSP in `vercel.json` (`connect-src 'self'`) blocks every other host. Never put image data, file names or user input into analytics, and keep the Privacy dialog in sync with what is sent.
- Presets live in `src/lib/presets.ts`. Every change needs `source` linking the official notification.
- KB limits use the strict reading: max ×1000, min ×1024 (`src/lib/compress.ts`). Don't change it without changing the tests.
- Untrusted images go through `loadImage` (`src/lib/process.ts`), which rejects decompression bombs before decoding. Don't bypass it.
