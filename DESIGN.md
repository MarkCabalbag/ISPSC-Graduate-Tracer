---
name: ISPSC Graduate Tracer
description: A graduate tracer survey and MIS admin for a Philippine state college, built as the category standard at full craft.
colors:
  ink: "#111827"
  ink-2: "#374151"
  muted-ink: "#4b5563"
  faint: "#6b7280"
  line: "#e5e7eb"
  line-strong: "#d1d5db"
  band: "#f9fafb"
  background: "#ffffff"
  brand: "#7d1128"
  brand-hover: "#67091f"
  brand-50: "#fbf1f3"
  brand-100: "#f5dde2"
  gold: "#c99a2e"
  gold-50: "#fef7e6"
  gold-ink: "#7a5a12"
  neutral-series: "#9ca3af"
  ok: "#166534"
  ok-50: "#ecfdf3"
  danger: "#b42318"
  danger-50: "#fef3f2"
typography:
  display:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  question:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0em"
  label:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "40px"
  field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "48px"
  card:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  chip-sample:
    backgroundColor: "{colors.gold-50}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.full}"
    height: "24px"
    padding: "0 10px"
  tag-yes:
    backgroundColor: "{colors.ok-50}"
    textColor: "{colors.ok}"
    rounded: "{rounded.full}"
---

## Overview

ISPSC Graduate Tracer is two surfaces sharing one design system: a **public survey** graduates fill in (GOV.UK / GOV.PH service pattern — one topic per page, big targets, plain language) and an **MIS admin** dashboard (Vercel-dashboard restraint — a figure-led overview, a filterable respondents table, and settings). The direction was chosen in an Impeccable decision round as "the category standard, executed at full craft": conventions a first-time visitor already knows, with the care in the details rather than in novelty. The college's **maroon `#7d1128`** is the single accent; **gold `#c99a2e`** is the second data series only. Everything else is a calm neutral scale on white and gray-50.

Mode: **Operate** (admin) and a task-focused public service. The tool disappears into the task; brand lives in precise details, not decoration.

## Colors

- **One accent.** `brand` (maroon) is primary buttons, selection, the active nav underline, focus intent, meters and chart series 1. Never as a large fill behind content.
- **Gold is data, not chrome.** `gold` is chart series 2 ("related to course", "private sector") and the "Sample data" chip. It is never a button or a background for text except `gold-50` behind `gold-ink`.
- **Neutrals carry the UI.** `ink` for text, `muted-ink`/`faint` for secondary and meta, `line`/`line-strong` for hairlines, `band` for the admin page ground and table headers, white for raised surfaces.
- **Semantic pairs** always use the 50-tint background with the 600-ish ink: `ok` on `ok-50`, `danger` on `danger-50`. A "No" answer is **neutral**, not red — only genuine problems are red.
- Text contrast meets WCAG AA (body ≥ 4.5:1); `faint` is used only for ≥ 16px meta on white.

## Typography

- **One family, self-hosted: Source Sans 3** (variable, `woff2`, `display: swap`, preloaded). No display/body pairing — a well-tuned sans carries headings, labels, data and body. No Google Fonts request (self-hosted, so the CSP forbids external font origins).
- **Fixed rem scale, not fluid.** Page titles ~28–40px/700, section headings 22px/700, questions 17px/600, body 16px/400, labels 13px/600 sentence case, small 13–15px.
- **Tabular numerals everywhere numbers line up** (`font-variant-numeric: tabular-nums` on tables, charts, counts, figures).
- Sentence case for every label, button and heading. `text-wrap: balance` on headings, `pretty` on paragraphs.

## Layout

- **Public pages**: one column, `min(100% - 32px, 1040px)`, generous line length (~640px measure for reading). GOV.UK rhythm: back link, step counter, h1, then the question group.
- **Admin**: a 64px top bar with the seal, real nav links (current page = maroon underline), then the page on the `band` ground inside `min(100% - 32px, 1312px)`. Content is a 12-column grid at `lg`, stacking to one column below.
- **Tables scroll inside their own rounded box** (`overflow-x-auto`), never widening the page; parents carry `min-w-0` so a wide table never breaks the shell at 320–768px.
- Mobile-first; breakpoints are structural (stack columns, let the table scroll), never fluid type. 44px minimum touch targets on the survey and standalone links.

## Elevation & Depth

Flat. Depth comes from **1px hairlines and one ground step** (white card on `band` page), not shadows. The only shadows are: the primary button's `inset 0 -2px 0 rgb(0 0 0/0.18)` press affordance, and dialog overlays (`0 24px 64px -16px rgb(17 24 39/0.35)` over a `rgb(17 24 39/0.45)` backdrop). No decorative shadows, gradients (except subtle chart fills) or blur.

## Shapes

Radius scale `sm 6 / md 8 / lg 10 / xl 12`, `full` for pills (chips, tags, page numbers). Controls and buttons use `md`; cards use `lg`; dialogs `xl`. **No one-sided rounded borders**: an inset notice uses a square left accent bar (`border-l-[6px]`, no radius), never a bar on a rounded box. Focus ring: `3px solid brand`, `2px` offset, never animated.

## Components

- **Buttons** (`src/components/kit.tsx`): `primary` (maroon, one per view for the main action), `secondary` (white, bordered), `ghost`, `danger`, `ghost-danger`. Sizes sm/md/lg; `loading` shows a spinner and sets `aria-busy`. Full set of states: hover, focus-visible, active (press), disabled.
- **Fields**: `TextField`, `SelectField`, `Radios` wrap native `input`/`select`/`radio`. Label above the control; hint below the label; error above the control in `danger`, with a 4px left accent (GOV.UK). `aria-invalid` and `aria-describedby` wired. `ErrorSummary` sits at the top of a failed form, focused, linking each field.
- **Charts** (`src/components/charts.tsx`): HTML/CSS only (no chart library). `GroupedBars`, `StackedBar`, `Meter` — **every bar is labelled with its value**, color is never the only cue, and each chart carries a `role="img"` text description. Series: maroon + gold (+ neutral for a third).
- **Tables**: sortable `SortHeader` sets `aria-sort` and a rotating caret; rows link out via a real link in the last cell, not a row click. Paging keeps page numbers + Prev/Next; a page-size select.
- **Dialogs**: native `<dialog>` (`showModal`) for confirm-delete and the programs CRUD — focus trap, Escape to close, focus returns to the opener. Never a hand-rolled modal.
- **Feedback**: `Skeleton` for loading (not spinners mid-content), `EmptyState` that teaches the next action, `ErrorState` with a retry, `react-hot-toast` for transient confirmations.
- **Chips/tags**: `Chip` (gold "Sample data", neutral, ok, danger), `tag-yes`/`tag-no` in the respondents table.

## Do's and Don'ts

- **Do** keep one maroon accent and one gold data series; let neutrals and whitespace do the work.
- **Do** label every chart value and give every control its full state set (hover, focus, disabled, loading, error).
- **Do** use native elements (`dialog`, `select`, radios, constraint validation) so keyboard, screen-reader and autofill behavior come free.
- **Do** respect `prefers-reduced-motion` (the global reset neutralizes animation).
- **Don't** use red for a plain "No" answer — red is reserved for problems and destructive actions.
- **Don't** put a one-sided accent bar on a rounded box, add decorative shadows/gradients, or reach for a second accent color.
- **Don't** add a charting or component library; the CSS charts and the native-first kit are the system.
- **Don't** let a wide table widen the page — it scrolls inside its own box.
