---
name: PortalPic
description: The exam notification's own rules table, with your file checked against it line by line.
colors:
  canvas: "#f4f3ee"
  panel: "#ffffff"
  raised: "#e9e7de"
  line: "#d3d0c4"
  line-strong: "#141414"
  foreground: "#141414"
  muted-foreground: "#55524a"
  pen: "#1a3fb5"
  pen-dark: "#132f8a"
  hl: "#ffe45c"
  pass: "#0e7a3d"
  fail: "#c4161c"
  warn: "#855600"
typography:
  display:
    fontFamily: "Anek Latin Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Anek Latin Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Anek Latin Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
  section:
    fontFamily: "Anek Latin Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.25
  button:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  lead:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  table:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    fontFeature: "tnum"
  secondary:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  sm: "2px"
  md: "2px"
  lg: "3px"
  xl: "4px"
  full: "9999px"
spacing:
  gap: "8px"
  gap-wide: "12px"
  cell: "14px"
  gutter: "16px"
  gutter-wide: "20px"
  section: "24px"
components:
  button-pen:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.panel}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "54px"
  button-pen-hover:
    backgroundColor: "{colors.pen-dark}"
  button-box:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "54px"
  button-box-hover:
    backgroundColor: "{colors.raised}"
  link-pen:
    textColor: "{colors.pen}"
  link-pen-hover:
    textColor: "{colors.pen-dark}"
  search-field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.foreground}"
    typography: "{typography.lead}"
    padding: "0 14px"
    height: "56px"
  continue-row:
    backgroundColor: "{colors.hl}"
    textColor: "{colors.foreground}"
    typography: "{typography.lead}"
    padding: "0 14px"
    height: "56px"
  form-cell:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.pen}"
    typography: "{typography.lead}"
    padding: "{spacing.cell}"
  rules-table-cell:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.foreground}"
    typography: "{typography.table}"
    padding: "10px 8px"
  stop:
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "44px"
  stop-current:
    backgroundColor: "{colors.hl}"
    textColor: "{colors.foreground}"
  tool-button:
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "52px"
    width: "58px"
  tool-button-pressed:
    backgroundColor: "{colors.raised}"
  masthead:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.foreground}"
    height: "52px"
---

# Design System: PortalPic

## Overview

**Creative North Star: "The Official Notice"**

PortalPic looks like the exam notification the applicant was already told to read: newsprint paper, white work sheets, black boxed tables. On top of that print sits one ballpoint pen. Black print is what the portal says; blue pen is what belongs to the applicant: their file's numbers, the ticks, the links, and the one button that moves them forward. The whole interface is that sentence drawn out.

It is built for someone mid-form on a cheap Android phone, often an older or less-educated reader, who must get one upload accepted. So the page is plain and large: body text at 16px in the phone's own font, buttons 54px tall, every tool named with a word, and one blue action on screen at a time. Nothing decorates. Colour appears only when it reports a state.

This light world replaces a dark developer-tool panel. It is not a white-card "1 · 2 · 3" resizer either: there are no cards, no gradients, no step numbers in circles. Structure comes from ruled boxes and from the two voices, print and pen.

**Key Characteristics:**
- Newsprint ground, white sheets, 1px black rules; a double rule under the masthead.
- Two voices: black print for the portal, blue ballpoint for the applicant.
- The three-column rules table (Rule · Portal asks · Your file) with one fixed mark cell per row.
- State colour only: red for a broken limit, green for the final pass verdict, yellow for where you are.
- Nearly square corners (2 to 4px); flat surfaces; two soft shadows on floating bars only.
- System font for body and numbers with tabular figures; one self-hosted display face for headings.
- One authored motion: the pen draws each tick.

## Colors

A printed page and one pen: warm paper neutrals, print black, a single ballpoint blue, and three state colours that never decorate.

### Primary
- **Ballpoint Blue** (`pen`, #1a3fb5): everything the applicant owns or does. The "Your file" column, ticks, links, the primary button, the size-meter fill, the dashed head guide, the caret and the focus outline.
- **Ballpoint Blue, pressed** (`pen-dark`, #132f8a): hover on the primary button and on links.

### Secondary
- **Highlighter Yellow** (`hl`, #ffe45c): where you are. The current stop on the line of stops, the "Continue with…" row on the home page, and text selection. Always carries print-black text.

### Tertiary
- **Notice Red** (`fail`, #c4161c): a broken limit. The failing value in "Your file", the strike mark, the meter fill when over, error messages.
- **Pass Green** (`pass`, #0e7a3d): the final verdict line "Ready to upload." and its PDF equivalent. Nowhere else.
- **Caution Amber** (`warn`, #855600): "it fits but may look blurry", and the boxed notice on a preset not confirmed from an official source.

### Neutral
- **Newsprint** (`canvas`, #f4f3ee): the page ground, masthead, line of stops, side column.
- **Work Sheet** (`panel`, #ffffff): anything you read from or type into: table, form cells, fields, tool band, the sticky result bar, dialogs.
- **Inset** (`raised`, #e9e7de): the crop stage behind the photo, the real-size preview well, hover on quiet controls, the pressed tool.
- **Light Rule** (`line`, #d3d0c4): dividers between sections of the same sheet.
- **Print Black** (`line-strong` / `foreground`, #141414): all portal text and every box rule.
- **Faded Print** (`muted-foreground`, #55524a): rule names, notes, placeholders, secondary lines.

### Named Rules
**The Print and Pen Rule.** Black is what the portal says, blue is what is yours. A value copied from the notice is never blue; a value measured on the applicant's file is never black.

**The Verdict Green Rule.** Green appears once per screen at most, on the sentence that says the file will pass. Row ticks stay blue: they are the pen checking, not the result.

**The State-Only Colour Rule.** Yellow, red, green and amber each mean one thing. None of them is ever used to make a surface look nicer.

## Typography

**Display Font:** Anek Latin Variable (self-hosted via `@fontsource-variable/anek-latin`; falls back to the system sans)
**Body Font:** the device's system sans (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans"`)
**Label/Mono Font:** none in use; numbers are system sans with tabular figures

**Character:** Headings have the heavy, slightly condensed voice of a printed notice headline; everything you actually read or compare is in the font the phone already has, so it costs no download and the figures line up in columns.

### Hierarchy
- **Display** (800, 30px, 40px from 640px up, line-height 1.1, -0.015em): the home question only. The wordmark uses the same face at 19px/800.
- **Headline** (700, 26px, tight): the heading on an empty preset page; 24px on the PDF tool, 22px for the dialog title.
- **Title** (700, 20px, tight): the form name at the top of each grid cell.
- **Section** (700, 19px, tight): side-column section headings ("What the portal asks", "Options", "Your file").
- **Button** (600, 18px, system): primary button text. The outline button uses 16px/500.
- **Lead** (500, 17px, line-height 1.375, system): things you tap or act on: form rows, the search field, the verdict line (600).
- **Body** (400, 16px, line-height 1.5, system): paragraphs and option names (500). Paragraphs cap at 60 to 70ch.
- **Table** (600 values, 400 rule names, 15px, tabular figures, system): the rules table.
- **Secondary** (400, 14px, system): notes, captions, helper lines, header links (500). The most used size on the page.
- **Label** (600, 13px, system): the smallest text allowed, used only for the uppercase rules-table headings and the picker's group headings. Tool words, meter labels and captions are 14px.

### Named Rules
**The 13px Floor Rule.** No text that carries information is smaller than 13px. If it will not fit at 13px, cut words or give it a line of its own.

**The One Download Rule.** Only headings (h1, h2, table column headings, the wordmark) use the display face. Body text, buttons and every number use the system font. No second web font is added.

**The Lined-Up Numbers Rule.** Tabular figures are on for the whole page, so the portal's number and the file's number can be compared digit by digit.

## Layout

Phone first, one column, 16px side gutters (20px from 640px). A 52px masthead sits on every page.

- **Home:** a single centred column up to 1024px wide. Question, one paragraph, the 56px search field, then every form in one boxed grid: 1 column on a phone, 2 from 640px, 3 from 1024px. Cells share rules (top and left on the grid, right and bottom on each cell) so the grid reads as one printed table, not separate cards.
- **Tool page, phone:** form picker row, the 56px line of stops, then the stage. Before a photo the stage holds the example, heading and the full-width primary button. After a photo the stage takes 58svh with a 76px tool band at its foot; the rules, options and preview scroll below; the verdict and Download stay fixed at the bottom of the screen above the safe-area inset.
- **Tool page, from 1024px:** the page locks to the viewport height. Stage on the left, a 400px right column (separated by a black rule) that scrolls, with the verdict and Download pinned at its foot.
- **Rhythm:** side-column sections use 24px top and 20px bottom padding, split by a light rule. Gaps inside a row are 8 or 12px. Grid cells pad 14px.
- **Touch:** rows you tap are at least 52px tall; stops and zoom buttons 44px; primary and outline buttons 54px.
- Below 440px the pixel-and-KB line under each form name is hidden to keep rows short.

**The One Blue Button Rule.** Each screen has exactly one filled blue button: Choose photo, then Download, then Next. Anything else that acts is an outline box or a blue underlined link.

## Elevation & Depth

Flat. Depth is shown the way print shows it: a white sheet on paper, a darker inset behind the photo, and a black rule around anything that matters. There are no shadows on tables, cells, fields or buttons.

### Shadow Vocabulary
- **Floating tool band** (`box-shadow: 0 6px 16px -8px rgb(20 20 20 / 0.4)`): the crop tools, because they sit on top of the applicant's photo.
- **Sticky result bar** (`box-shadow: 0 -8px 24px -12px rgb(20 20 20 / 0.3)`): the phone verdict bar, because page content scrolls underneath it.

### Named Rules
**The Floats-Only Rule.** A shadow is allowed only on something that physically covers other content. Everything that sits in the page is flat and ruled.

## Shapes

Printed boxes. Corners are nearly square: 2px on buttons, stops and small tags, up to 4px on dialogs; fields, table cells, grid cells and the search box have no radius at all. Rules are 1px print black for boxes and 1px light rule for dividers; the masthead alone gets a 4px double rule, like a newspaper nameplate. The example pictures and the crop frame use a 1.5px black border.

Full rounds are reserved for things that are round in real life or by convention: the switch and its thumb, the slider thumb, the stop dots on the line, and the small tick badge on the home picture. A dashed black border means "nothing here yet" (the add-files row, an upload with no example drawing).

Icons are thin line icons (Lucide, 16 to 24px, stroke 1.6 to 2). The illustrations (portrait, signature, thumbprint, declaration, pages) are flat SVG with no gradients, drawn at each upload's real proportions.

## Components

### Buttons
Plain, large and square, like a box printed on a form.
- **Shape:** nearly square (2px radius), 54px tall.
- **Primary (pen):** ballpoint-blue fill, white 18px/600 text, 20px side padding, usually full width. Icon, when present, sits before the word at 16px.
- **Hover / Focus / Active:** fill darkens to the pressed blue over 150ms; focus shows a 2px blue outline offset 2px; pressing nudges it down 1px. Disabled is 40% opacity and ignores taps.
- **Outline (box):** white fill, 1px black rule, 16px/500 black text; hover fills with the inset tone. Used for the second action beside a primary.
- **Link (pen):** blue, medium weight, always underlined (3px offset); darkens on hover. Buttons that open a dialog from inside a sentence look like this too.

### Rules Table (signature)
The centre of the product. A white, fixed-layout table with 1px black rules on every cell and four columns: Rule (78px, faded print, normal weight), Portal asks (black, 600), Your file (blue, 600; red when the rule is broken; a faded dash before a file exists), and a 36px mark cell. Column headings are uppercase display face with 0.05em tracking, and "Your file" is headed in blue. The mark cell holds a blue pen tick or a red strike, drawn in 320ms with an ease-out curve, each row starting 90ms after the one above. With reduced motion the marks simply appear.

### Size Meter
File size drawn against the limit: a 12px-tall white bar with a black rule, the allowed range tinted pale blue, and a solid fill (blue when inside, red when outside) that grows over 420ms. A small filled tag above the fill carries the measured size in white 14px/600; the limits are labelled beneath in faded print.

### Line of Stops
A form's uploads as stops on one line (56px band on paper, light rule beneath). Each stop is a 44px-tall button with a small ring and the upload's name at 15px; stops are joined by short black dashes. The current stop gets the highlighter fill, a filled dot and 600 weight. A stop downloaded in this visit swaps its ring for a blue tick. On a phone the line scrolls sideways and keeps the current stop in view; a short "1 of 4" count sits at its left.

### Result Bar
The verdict sentence at 17px/600 with a 20px status icon, in green, amber or red, followed in black by the file's size and pixels when it passes. Under it, the one primary button: Download; after saving, "Next: <upload>" with a worded "Download again" link in the line beneath. White sheet, black rule on top. Fixed to the bottom on phones, pinned to the foot of the right column on desktop.

### Forms Grid
Every form at once in one ruled table of white cells. Each cell: the form name as a 20px title, then one row per upload: a 36px drawing of that upload at its real shape, its name in blue at 17px/500, and (from 440px) its pixels and KB in 14px faded print. Rows are at least 52px tall and tint to the inset tone on hover.

### Inputs / Fields
- **Search:** 56px tall, white, 1px black rule, no radius, a 20px search icon, 17px text.
- **Number fields:** 44px tall, same box; the typed value is blue 16px/600 because it is the applicant's own number. Label sits above in 14px faded print.
- **Focus:** 2px blue outline, 2px offset.
- **Switch:** a 48×28px pill with a black rule. Off: white track, black thumb. On: blue track, white thumb. Always paired with a 16px/500 name and a 14px line saying what it does, in a row at least 48px tall.
- **Slider:** thin black track with a round black thumb.

### Crop Stage and Tools
The photo sits on the inset tone inside a 1.5px black frame; the area outside the crop is veiled in the same tone. A blue tag under the frame states the output pixels. For face photos a dashed blue head oval and eye line (white underlay so it shows on any photo) guide framing, with a one-line instruction in a small white boxed label. The tool band is a white box with a black rule, floating over the foot of the stage: zoom out, slider, zoom in, a hairline divider, then word-carrying tools (62×52px, 20px icon above a 14px/500 word: Turn, Guide, Change). A toggled tool takes the inset fill.

### Navigation
- **Masthead:** 52px, paper ground, 4px double black rule beneath. Left: the mark and "PortalPic" in the display face. Right: "Stays on your device" with a shield icon (opens the privacy dialog) and plain 14px/500 text links that tint on hover.
- **Form picker:** an outline box showing "Form / Upload" (form in faded print, upload in 600 black) with an up-down chevron; opens a searchable list.
- **Footer:** 14px faded print with blue underlined links.

### Empty State
Centred, up to 24rem wide: an example drawing of the upload at its real shape, a 14px caption with the pixels, the headline, the full-width primary button, then two short 14px lines: the privacy sentence with a "How we know" link, and the accepted file types.

## Do's and Don'ts

### Do:
- **Do** set anything the portal printed in print black and anything measured from the applicant's file in ballpoint blue.
- **Do** keep exactly one filled blue button on a screen, 54px tall, with a plain verb on it.
- **Do** put a word with every tool icon. An icon alone is a guess for someone who has never cropped a photo.
- **Do** keep information-carrying text at 13px or larger and body text at 16px.
- **Do** use the system font for body text, buttons and numbers, with tabular figures, and Anek Latin only for headings.
- **Do** box things with 1px black rules on white, and let neighbouring boxes share a rule.
- **Do** show an upload at its real proportions wherever it is pictured.
- **Do** say what each state colour says in words as well (an icon and a sentence, a tick with hidden text), so colour is never the only signal.
- **Do** respect reduced motion: ticks, fills and the button press all stop.
- **Do** keep the privacy words literally true. If a screen says "Nothing is uploaded", no feature on it may send a file, a file name or typed input anywhere.

### Don't:
- **Don't** bring back the dark panel look, or add a dark mode by default; the owner chose light.
- **Don't** use green for anything except the final pass verdict.
- **Don't** use yellow, red or amber as decoration; each one reports a state.
- **Don't** put shadows on boxes, cells, fields or buttons; only the two floating bars have one.
- **Don't** round corners past 4px, except the switch, slider thumb, stop dots and the tick badge.
- **Don't** add a second web font, or set body text or numbers in the display face.
- **Don't** add gradients, glass, or tinted cards; structure comes from rules and the two voices.
- **Don't** add motion beyond the tick being drawn, the meter filling, and 150ms colour changes.
- **Don't** load fonts, images or scripts from another host; everything is self-hosted so the "never uploaded" claim and the site's security policy stay true.

## Dark look

The same notice read at night. The page follows the device setting until the visitor uses the header switch (sun or moon); the pick is stored as `pp.theme` and applied before paint by `public/theme.js`. Every rule above holds; only the token values change (`@utility theme-dark` in `src/index.css`).

| Role | Light | Dark |
|---|---|---|
| Paper (canvas) | `#f4f3ee` | `#131311` |
| Sheet (panel) | `#ffffff` | `#1c1c19` |
| Inset (raised) | `#e9e7de` | `#262520` |
| Light rule | `#d3d0c4` | `#3b3a32` |
| Print (text, box rules) | `#141414` | `#efede4` / `#e9e7dd` |
| Faded print | `#55524a` | `#aaa79b` |
| Ballpoint blue | `#1a3fb5` | `#93abff` |
| Text on blue | `#ffffff` | `#0e1326` |
| Highlighter | `#ffe45c` | `#5a4b00` |
| Pass / fail / caution | `#0e7a3d` / `#c4161c` / `#855600` | `#5ccf8a` / `#ff7d72` / `#e6b655` |

- Example pictures and the user's own photo keep their white paper in both looks: they are pictures of real paper, not interface.
- **Switch motion:** the new look opens as a circle from the switch to the farthest corner (View Transitions, 1000ms, `cubic-bezier(0.76, 0, 0.24, 1)`). Browsers without view transitions, and visitors who ask for reduced motion, get an instant switch.
