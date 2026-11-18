# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + shadcn/ui (heavily restyled, never default-looking), bun for packages. Hosted on Vercel with per-PR previews. Was a single static HTML file before the 2026-11 redesign.

## Users

Indian government exam and visa applicants (IBPS, SSC, UPSC, RRB, NEET, JEE, CUET, GATE, PAN, US DS-160) who are mid-way through an online application form and have hit an upload rejection: their photo or signature is the wrong pixel size or KB. Mostly on phones, often low-end Android on mobile data, sometimes at a cyber cafe. They are stressed, time-boxed by form deadlines, and not technical.

## Product Purpose

Turn any photo or scanned signature into a file the portal accepts on the first try: exact pixel dimensions, inside the KB range, correct format and DPI. Success is a download that uploads without error.

## Positioning

Runs entirely in the browser: the ID photo and signature never leave the device. Presets are sourced from official notifications and each links to its source. It hits minimum KB limits too (raises quality first, then pads with invisible JPEG comment bytes), which most resizers ignore. Free, open source (MIT), no ads.

## Operating Context

Used alongside the application portal, often in another tab or after switching apps on a phone. Inputs are phone camera photos, gallery images (HEIC on iPhone), or scans of a signature on paper. Output is a single JPG downloaded and then uploaded to the portal.

## Capabilities and Constraints

- 23 presets in `presets.js` (exact vs suggested sizes; one marked unverified). Custom size option.
- Crop with drag/zoom, rotate 90°, clean-paper filter for ink presets, DPI header write, EXIF stripped.
- Compression logic lives in `compress.js` (pure, tested with `bun test`); must stay client-side.
- SSC and RRB photos are captured live by webcam, so only signature presets exist for them.
- English only for now; copy must stay translation-ready (Hindi likely later).
- Must perform well on low-end Android and slow networks.

## Brand Commitments

Name: PortalPic. Voice: plain, calm, direct, no hype. Privacy claim ("never uploaded") must remain literally true.

## Evidence on Hand

Reddit demand post: https://reddit.com/comments/1xnhggs. Official spec PDFs linked per preset. No testimonials, user counts, or press exist; do not fabricate any.

## Product Principles

1. First-try success: the file must pass the portal's check, and the UI must make "this will pass" unmistakable.
2. Trust through verifiability: privacy and spec claims are shown with evidence (official source links, on-device processing), not asserted.
3. Fast on a cheap phone: nothing heavy that delays the first useful action.
4. One job, no detours: pick form, pick photo, download.

## Accessibility & Inclusion

Non-native English readers; large touch targets; works one-handed on small screens; WCAG AA contrast.
