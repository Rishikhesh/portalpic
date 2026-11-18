# Notes for agents

- Run `bun run check` (types, lint, tests, build) before you finish. The pre-commit hook and the Vercel build both run it.
- The photo never leaves the device. The only network traffic is Vercel Web Analytics (cookieless page views; each download is recorded as a page view of `/_download/<preset-id>`) to this site's own `/_vercel/insights`. The CSP in `vercel.json` (`connect-src 'self'`) blocks every other host. Never put image data, file names or user input into analytics, and keep the Privacy dialog in sync with what is sent.
- Presets live in `src/lib/presets.ts`. Every change needs `source` linking the official notification.
- KB limits use the strict reading: max ×1000, min ×1024 (`src/lib/compress.ts`). Don't change it without changing the tests.
- Untrusted images go through `loadImage` (`src/lib/process.ts`), which rejects decompression bombs before decoding. Don't bypass it.

## Preset requests

Followed by the preset agent (`.github/workflows/preset-agent.yml`) after the owner labels an issue `approved`.

1. **Research.** Find the official notification PDF or the portal's own upload instructions for the exact form asked for. Only government or official portal domains count; resizer blogs and coaching sites do not. Record: pixel size (exact or min/max), KB range, format, DPI, and the human rules (background, face size). Quote each line you rely on with its URL. Official notices are usually PDFs that web fetch can't read: run `sh scripts/pdf-text.sh <https URL of the PDF>` to get their text.
2. **No official source → stop.** Write `.preset-needs-info.md` in the repo root (not committed) saying what you searched and found, and change nothing else. The workflow comments it on the issue and labels it `needs-info`.
3. **Choose the values.** `exact: true` only when the portal states the pixels. Otherwise pick the smallest size that satisfies the rules at the right shape, and say so in the PR. KB in the preset is what the notice says; `compress.ts` already applies the strict reading.
4. **Test first.** In `src/lib/presets.test.ts`, add a test named `preset <id> matches the official notice` asserting the new entry's `w`, `h`, `minKB`, `maxKB`, `exact`, `dpi` and `source`. Run `bun test src/lib/presets.test.ts` and see it fail.
5. **Add the preset** to `src/lib/presets.ts` in its group (or a new group named after the country or portal), with `note`, `source` and `official: true`. Ids are lowercase kebab-case, e.g. `sbi-clerk-photo`.
6. **Check.** `bun run check` must pass.
7. **Hand off.** Commit the test and the preset in one commit on the current branch and push it. Then write `.preset-pr.md` in the repo root (not committed): the first line is the PR title (`# Add preset: <Form> <upload>`), the rest is this body. The workflow checks it and opens the PR.

```
Adds the <Form> <upload> preset.

Preset-Id: <id>
Closes #<n>

| Rule | Value | Source quote |
|---|---|---|
| Pixels | … | "…" |
| File size | … | "…" |
| Format / DPI | … | "…" |

Source: <official URL>
Choices made: <any size picked within a range, or "none">

Preview: open /<id> on the Vercel preview link below.
```
