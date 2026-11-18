# Request form script

Bound to the Google Sheet that collects the [request form](https://forms.gle/gWTPthBeRC2ScrZy9)'s answers.

- `onFormSubmit` turns each answer into a GitHub issue labelled `preset` and `from-form`. The email answer stays in the Sheet; the issue only carries `Sheet row: <n>`.
- `checkClosed` runs every 15 minutes. For each closed `from-form` issue whose requester left an email, it sends one message: "it's live at …" or "we couldn't add it", then marks the row **Notified**.
- `lib.js` holds the pure logic, tested by `lib.test.ts` (`bun test apps-script`).

## Deploy

```sh
bunx @google/clasp login                     # once, opens your browser
bunx @google/clasp create --type sheets --parentId <SHEET_ID> --rootDir apps-script --title "PortalPic requests"
bunx @google/clasp push
```

Then in the script editor (Extensions → Apps Script from the Sheet):

1. Project Settings → Script Properties → add `GITHUB_TOKEN`: a fine-grained token with **Issues: read and write** on `Rishikhesh/portalpic` only.
2. Run `install` once and allow the permissions it asks for.

`lib.test.ts` and this README are excluded from the push by `.claspignore`.
