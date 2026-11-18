# Secrets and how to revoke them

No secret is stored in this repository. This is where each one lives, what it can do, and how to kill it.
If you suspect any leak: **revoke first, investigate after.** Revoking breaks nothing that can't be re-created in a few minutes.

| Secret | Lives in | Can do | Expires | Revoke / rotate |
|---|---|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | GitHub → repo → Settings → Secrets and variables → Actions (encrypted; only workflows on `main` can read it) | Run Claude Code on the owner's Claude subscription | 1 year from creation | Revoke in your Claude account settings, run `claude setup-token` again, then `gh secret set CLAUDE_CODE_OAUTH_TOKEN` |
| GitHub fine-grained token `PortalPic form` | Google Apps Script → PortalPic requests → Project Settings → Script Properties `GITHUB_TOKEN` | Read/write **issues** on `Rishikhesh/portalpic` only | As set when created (keep ≤ 90 days) | https://github.com/settings/personal-access-tokens → Revoke; create a new one, paste it into Script Properties |
| Apps Script authorisation | Google account → Third-party connections → "PortalPic requests" | Read this Sheet, send email as the owner, call GitHub, run on a timer | Until revoked | https://myaccount.google.com/connections → remove; re-run `install` to re-authorise |
| `GITHUB_TOKEN` (Actions) | Created per workflow run by GitHub | Repo access for that run only | When the run ends | Nothing to do |
| `gh` CLI login | macOS Keychain on the owner's laptop | Full access to the owner's repos (`repo`, `workflow`) | Until revoked | https://github.com/settings/applications → GitHub CLI → Revoke; `gh auth login` again |
| Vercel CLI login | Not stored (logged out). Deploys happen from GitHub pushes | — | — | When needed: `vercel login`, then `vercel logout` afterwards |
| clasp (Apps Script CLI) login | Not stored (logged out) | — | — | When needed: `bunx @google/clasp login`, then `clasp logout` and remove "clasp" at https://myaccount.google.com/connections |

## Guards already in place

- The preset agent only runs when the repo owner adds `approved`, gets no GitHub token or `gh` in its shell, and runs with secret scrubbing on (`.github/workflows/preset-agent.yml`).
- `main` is protected: changes need a pull request with one approval; only the owner can bypass.
- GitHub secret scanning and push protection are on: a commit containing a known token format is blocked.
- Requester emails stay in the private Google Sheet; issues and PRs never contain them.
- The site's Content Security Policy blocks every network request except its own analytics endpoint.

## Laptop

Anyone logged in to the laptop as the owner can use whatever that session can (the `gh` login, SSH keys, the browser). Keep FileVault on, a strong login password, and auto-lock after a few minutes. If the laptop is lost or someone else had access, revoke every row in the table above.
