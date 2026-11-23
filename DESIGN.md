---
name: Leslie 2101/2103 mk2 Editor
description: shadcn/ui, user preset b1GdzAEwU (stone + amber) — a shadcn instrument editor with one custom control family (engraved faders) and vector visualizations
colors:
  background: "oklch(0.147 0.004 49.25)"
  foreground: "oklch(0.985 0.001 106.423)"
  card: "oklch(0.216 0.006 56.043)"
  card-foreground: "oklch(0.985 0.001 106.423)"
  popover: "oklch(0.216 0.006 56.043)"
  popover-foreground: "oklch(0.985 0.001 106.423)"
  primary: "oklch(0.473 0.137 46.201)"
  primary-foreground: "oklch(0.987 0.022 95.277)"
  secondary: "oklch(0.274 0.006 286.033)"
  secondary-foreground: "oklch(0.985 0 0)"
  muted: "oklch(0.268 0.007 34.298)"
  muted-foreground: "oklch(0.709 0.01 56.259)"
  accent: "oklch(0.268 0.007 34.298)"
  accent-foreground: "oklch(0.985 0.001 106.423)"
  destructive: "oklch(0.704 0.191 22.216)"
  border: "oklch(1 0 0 / 10%)"
  input: "oklch(1 0 0 / 15%)"
  ring: "oklch(0.553 0.013 58.071)"
  chart-1: "oklch(0.879 0.169 91.605)"
  chart-2: "oklch(0.769 0.188 70.08)"
  chart-3: "oklch(0.666 0.179 58.318)"
  chart-4: "oklch(0.555 0.163 48.998)"
  chart-5: "oklch(0.473 0.137 46.201)"
  success: "oklch(0.723 0.219 149.579)"
typography:
  brand:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  caption:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.03em"
  value:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
rounded:
  sm: "calc(0.625rem - 4px)"
  md: "calc(0.625rem - 2px)"
  lg: "0.625rem"
  xl: "calc(0.625rem + 4px)"
spacing:
  row: "6px 10px"
  block: "16px 20px 18px"
  gutter: "24px"
  block-gap: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  toggle-item:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    height: "30px"
    padding: "0 10px"
  toggle-item-on:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "16px 20px 18px"
---

# Design System: Leslie 2101/2103 mk2 Editor

## Overview

**Creative North Star: "shadcn, one custom instrument"**

The editor is a **shadcn/ui application** themed by the user's **shadcn/create preset
`b1GdzAEwU`** — stone neutrals with an amber primary and an amber chart ramp — on
shadcn's CSS-variable token system (user decisions, 2026-11-20; this replaces the earlier
hand-built "night amp facade" world). Both preset modes are installed in `:root`/`.dark`;
the app runs dark (`html.dark`), and the light pair is ready for a future toggle. Every visual decision routes through the semantic tokens
(`background`, `card`, `primary`, `muted-foreground`, `accent`, `destructive`, `border`,
`input`, `ring`, `radius`) exactly as shadcn's theming docs define them, so the app can be
re-themed by swapping token values alone. The stack stays vanilla TypeScript: components
follow shadcn's visual recipes rather than importing its React code.

Exactly one control family is custom by design: the **engraved fader** (slider restyled
as an instrument fader with detent-true tick scales), plus the vector visualizations.
Everything else is the stock component it looks like.

**Key Characteristics:**
- Token values verbatim from the user's shadcn/create preset (light + dark installed, dark active).
- `--success` is the one added token (connected LED), added per shadcn's "Adding New Tokens" pattern; the preset ships no green.
- Real-world units lead (46 rpm, 1.8 s); raw MIDI data secondary in `muted-foreground`.
- `destructive` is reserved for honest flags: unverified tables, MIDI errors.

## Colors

Semantic shadcn pairs only; no raw hex in component styles.

### Primary
- **primary / primary-foreground**: the amber action color — "Save to memory", fader fill and
  thumb, viz strokes, the "changed" dot. The amber is the preset's brand voice.

### Neutral
- **background / foreground**: page shell and default text.
- **card / card-foreground**: parameter blocks, explainer panel, banners, console.
- **secondary**: the fader groove. **muted / muted-foreground**: labels, secondary text,
  kbd chips. **accent / accent-foreground**: hover and selected states (toggle items,
  focused parameter row at 50%).
- **border / input / ring**: separators, control outlines, focus rings (3px ring at 50%).
- **chart-1…5**: the preset's amber ramp, reserved for future charts. Fader tick marks
  and scrollbar thumbs use `muted-foreground` color-mixes instead (the amber ramp is too
  loud for graduations).

### Tertiary
- **success** (project token): connected-LED only. **destructive**: alerts, unverified
  flags, error states — never decoration.

### Named Rules
**The Token Rule.** No color that is not a theme token. Re-theming the app must require
touching `:root` only.
**The Destructive Honesty Rule.** `destructive` marks real uncertainty or failure
("table unverified", MIDI denied) and nothing else.

## Typography

**Font:** shadcn stock system stack (`ui-sans-serif, system-ui…`); mono stack for real
MIDI bytes only.

### Hierarchy
- **Title** (600, 18px, -0.01em): explainer heading.
- **Card title** (600, 14px): block headers, sentence case.
- **Label** (500, 12px, +0.03em, uppercase): parameter names — the machine's own menu
  names (RISE TIME…), kept uppercase as product truth.
- **Value** (600, 14px, tabular-nums): converted real-unit readouts; 11px
  `muted-foreground` line beneath for the raw data value.
- **Body** (400, 13.5px): explainer prose, `muted-foreground` with `foreground` lead-ins.
- **Mono** (12px): console bytes.

### Named Rules
**The Machine's Words Rule.** Parameter labels are the unit's own menu names.
**The Tabular Rule.** Changing numbers sit in tabular numerals.

## Layout

Fixed app frame: header → banners → `1fr / minmax(360px, 430px)` main grid → collapsible
console. Edit zone scrolls internally; two Card columns above 1260px, one below; floor
1100px (no mobile by product decision). Rows: `118px / 1fr / 86px` grids, enum rows move
their ToggleGroup to a full-width second line. Rhythm: 24px gutters, 16px block gaps.

## Elevation & Depth

shadcn's flat-with-hairlines model: `border` separators on `card` surfaces, shadcn's
`shadow-xs` (`0 1px 2px rgb(0 0 0 / 0.05)`) on Cards and the primary button. The fader is
the deliberate exception (see Components): its groove uses an inset shadow
(`inset 0 1px 2px rgb(0 0 0 / 0.6)`) and its thumb a drop shadow
(`0 2px 4px rgb(0 0 0 / 0.4)`) — the engraved instrument detail carried over by user
decision, in zinc colors.

## Shapes

shadcn radius scale from the preset's `--radius: 0.45rem` (sm/md/lg/xl derived). Buttons and selects
`radius-md`, Cards `radius-xl`, viz insets `radius-lg`, kbd and fader thumb `radius-sm`.
Component-internal micro-radii: the 4px fader track and its fill use 2px; scrollbar
thumbs 5px.

## Components

### Buttons (shadcn Button)
- **Primary** ("Save to memory"): `primary` bg, `primary-foreground` text, h-36px, radius-md,
  shadow-xs; hover = 90% primary.
- **Outline**: transparent, `input` border; hover = `accent` bg.

### Toggle groups (shadcn ToggleGroup, outline)
- Joined items in one `input`-bordered radius-md group, 30px tall; `input` separators;
  hover `muted`; on-state `accent` + `accent-foreground`. Used for every enum parameter
  and the Preset 1/2 switch (36px tall in the header).

### Select (native select, shadcn Select trigger look)
- `input` border, radius-md, h-36px, chevron icon in `muted-foreground`; used for MIDI
  port and channel pickers.

### Cards (shadcn Card)
- `card` bg, `border`, radius-xl, shadow-xs; 14px/600 titles with a `border` underline.

### Alerts (full-width strips)
- `card` bg strip with `border-bottom`; lead text `card-foreground` 500; destructive
  variant in `destructive` text. Honesty banner is permanent.

### Engraved fader (custom; the one bespoke control)
- Native range input: 4px groove in `secondary` with inset shadow, fill and 14×22px
  thumb in `primary` (amber), tick scale under the track in `muted-foreground` 60%
  hairlines at the parameter's real detents. Keyboard: arrows, Shift+arrows, Delete/double-click reset;
  `aria-valuetext` speaks the converted value.

### Visualizations (custom, token-fed SVG)
- Rotor (spins at real rpm, reduced-motion aware), speed-time curve, crossover diagram,
  character schematic. Strokes in `primary`, grids in `muted-foreground` 45%, labels in
  `muted-foreground`, on `background` insets. Qualitative diagrams say so in captions.

### Console (shadcn Collapsible)
- `card` strip, ghost toggle with chevron, mono byte log (`foreground` hex,
  `muted-foreground` decode), 180px ScrollArea-style log.

### Kbd (shadcn Kbd)
- `muted` bg, `border`, radius-sm, 11px mono.

## Do's and Don'ts

### Do:
- **Do** express every color through the shadcn tokens; add new semantic tokens (like
  `--success`) via the official pattern instead of inlining values.
- **Do** keep real units first (46 rpm, 1.8 s) with raw data beneath.
- **Do** keep `destructive` for honest flags and failures only.
- **Do** keep the fader family and the SVG visualizations as the only custom visuals.

### Don't:
- **Don't** hand-pick colors outside the preset; evolve the theme by regenerating the
  shadcn/create preset, not by editing component styles.
- **Don't** use raw hex/oklch in component styles — tokens only.
- **Don't** replace the fixed explainer with tooltips or popovers.
- **Don't** load fonts or assets from a CDN — system stack, offline-safe.
