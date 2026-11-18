# Notes for agents

- Run `bun run check` (types, lint, tests, build) before you finish. The pre-commit hook and the Vercel build both run it.
- Nothing may leave the device: no network calls, analytics or uploads. The CSP in `vercel.json` (`connect-src 'none'`) enforces this.
- Presets live in `src/lib/presets.ts`. Every change needs `source` linking the official notification.
- KB limits use the strict reading: max ×1000, min ×1024 (`src/lib/compress.ts`). Don't change it without changing the tests.
- Untrusted images go through `loadImage` (`src/lib/process.ts`), which rejects decompression bombs before decoding. Don't bypass it.
