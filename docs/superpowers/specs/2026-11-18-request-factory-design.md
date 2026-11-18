# Request factory: from a user's request to a deployed preset

Date: 2026-11-18 · Status: draft, awaiting approval

## Intent

People ask for presets through the Google Form or a GitHub issue. The owner should only ever do two things: approve a request, then review a preview and merge it. Everything in between — researching the official rules, building, testing, opening a PR — is done by an agent. The requester hears back automatically when it is live.

Why: PortalPic is only as good as its preset list, and each preset needs careful research against official notices. The owner wants that work to happen without them, while keeping the final say.

## Goals

- One inbox: every request, from either channel, becomes a GitHub issue.
- Click 1 (approve): adding the `approved` label starts the agent. Nothing runs without it.
- The agent researches the official source (notification PDF or government upload page), quotes the exact lines it relied on, and refuses to build if no official source states the rules.
- Test first: the agent adds a failing test for the new preset's values, then the preset, then runs `bun run check`.
- The agent opens a PR whose description holds the evidence (quotes + links) and posts progress on the issue.
- Vercel posts a preview link on the PR (already works today).
- Click 2 (merge): merging deploys to portalpic.com (already works today).
- On merge, the issue gets a "Live at portalpic.com/<id>" comment and closes; form requesters who left an email get the same message by email.

## Non-goals

- Auto-merge. May be turned on later once the agent has a track record.
- Requests that aren't presets (features, bugs). The agent may comment and stop; a later version can widen scope.
- A dashboard. GitHub issues and the GitHub mobile app are the UI.

## Anti-goals

- A requester's email appearing anywhere public (issues, PRs, logs).
- A preset going live without an official source quoted in the PR.
- The agent running on unapproved issues (spam, prompt injection in issue text).

## Approaches considered

1. **GitHub Actions + Claude Code Action (chosen).** Runs on GitHub's free runners for public repos, billed to the owner's Claude subscription via an OAuth token. Native access to the issue, branch, PR and comments. Works for any future repo by copying the workflow.
2. Local agent on the owner's machine polling GitHub. No CI setup, but only works while the laptop is on, and secrets live in more places.
3. A hosted service (Zapier/n8n + an LLM API). Extra accounts and API billing; weaker access to the repo and test suite.

Picked 1: it reuses everything already in place (AGENTS.md, `bun run check`, Vercel previews) and needs no machine of the owner's.

## Design

**Intake**
- GitHub issue form (exists): issues get the `preset` label.
- Google Form → linked Sheet → Apps Script `onFormSubmit` trigger creates an issue labelled `preset` and `from-form`, with the answers except email. The issue body carries the Sheet row number; the email stays in the Sheet. The script holds a fine-grained GitHub token (Issues: read/write on this repo only) in Script Properties.

**Agent run** (`.github/workflows/preset-agent.yml`)
- Trigger: `issues: labeled` where the label is `approved` and the actor is the repo owner.
- Steps: checkout, set up bun, `bun install`, run the Claude Code Action with a fixed prompt:
  1. Find the official notification or upload page for the requested form. Only government or portal domains count.
  2. Extract pixel size, KB range, format, DPI and photo rules; quote the source lines.
  3. If no official source states the rules: comment what was found and stop, labelling `needs-info`.
  4. Add a test asserting the new preset's values, see it fail, add the preset to `src/lib/presets.ts`, run `bun run check` until it passes.
  5. Open a PR "Add preset: <name>" with the evidence, `Closes #<issue>`.
- Untrusted input: the issue text is data for research only; the prompt says so, the workflow only runs after the owner's label, and the agent's tools are limited to web fetch/search, editing files, `bun` and `gh pr`.

**Review and deploy**
- Vercel comments the preview URL on the PR. Owner opens `/<preset-id>` on the preview, checks, merges.
- Push to `main` → Vercel production deploy (existing).

**Reply**
- Workflow on `pull_request: closed` (merged) finds the linked issue, comments "Live at https://portalpic.com/<id>", and closes it (GitHub also auto-closes via `Closes #`).
- Apps Script time trigger (every 15 min): for issues labelled `from-form` that closed since the last run, look up the Sheet row, email the requester via MailApp if they gave an email, mark the row as notified.

## Setup the owner does once

- `claude setup-token` → add as repo secret `CLAUDE_CODE_OAUTH_TOKEN`.
- Install the Claude GitHub app on the repo.
- Create a fine-grained GitHub token (Issues: read/write, this repo) and paste it into the Apps Script's Script Properties.
- Authorise the Apps Script (Forms, Sheets, Gmail send).

## Left to the builder

- Exact Claude Code Action inputs and tool allowlist (check current action docs).
- Label colours and names beyond `preset`, `from-form`, `approved`, `needs-info`.
- Email wording.
