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
  option-tile:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "56px"
  option-tile-selected:
    backgroundColor: "{colors.brand-50}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  survey-rail:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    width: "380px"
    padding: "36px 40px"
  done-panel:
    backgroundColor: "{colors.ok-50}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "28px"
---

## Overview

ISPSC Graduate Tracer is two surfaces sharing one design system: a **public survey** graduates fill in (GOV.UK / GOV.PH service pattern — one topic per page, big targets, plain language) and an **MIS admin** dashboard (Vercel-dashboard restraint — a figure-led overview, a filterable respondents table, and settings). The direction was chosen in an Impeccable decision round as "the category standard, executed at full craft": conventions a first-time visitor already knows, with the care in the details rather than in novelty. The college's **maroon `#7d1128`** is the single accent; **gold `#c99a2e`** is the second data series only. Everything else is a calm neutral scale on white and gray-50.

Mode: **Operate** (admin) and a task-focused public service. The tool disappears into the task; brand lives in precise details, not decoration.

## Colors

- **One accent.** `brand` (maroon) is primary buttons, selection (including the picked answer tile's border, on a `brand-50` ground), the active nav underline, focus intent, meters and chart series 1. Never as a large fill behind content: the survey's done screen uses the green `ok` panel, not a maroon block.
- **Ink as a ground.** `ink` is the one dark surface: the public header, the survey's step rail and its phone step bar. Text on it is white for titles, `#e5e7eb` for done steps and `#9ca3af` (≈6.6:1) for descriptions, upcoming steps and notes. Hairlines on ink are `#374151`.
- **Ok marks completion.** `ok` / `ok-50` (border `#bbe5c9`, body text `#14532d`) carry the "Survey complete" panel and its tick. On the ink rail a done step is a white disc with an ink tick, not green.
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

- **Privacy notice** (`/privacy`): the service frame (`SiteLayout`), one column, `min(100% - 32px, 1040px)`, generous line length (~640px measure for reading).
- **Start page** (`/`, chosen 2026-11-24, Option C · Santa Maria hero): a photo-led hero, then the body on white, then `SiteFooter` with a photo credit. Breakpoint `md` (768px).
  - **Hero:**
    - Full width, `min-h-[560px]`, `md:min-h-[640px]`.
    - The CC0 photo of Nuestra Señora de la Asunción Church (`santa-maria-church-800/1600.jpg`, `object-[38%_50%]`, `md:object-[50%_45%]`) under the `.hero-scrim` overlay.
    - **Brand row:** absolute `<header>` over the hero, `py-5`: seal 36px + "Graduate Tracer" 19px bold, the college line 13px `#d1d5db` from `md`, and the chip right in demo mode.
    - **Text block:** bottom-left inside the 1040px width, `max-w-[640px]`, `pt-24 pb-8 md:pb-16`, gaps 18/22px.
      - h1 38/60px, leading 1.02, tracking −0.03em, white.
      - Intro 17/20px, leading 1.55, `#e5e7eb`.
      - A row: Start now + "About 5 minutes · Once, with your own email" (16px `#d1d5db`).
  - **Body:** `pt-9 pb-14 md:pt-14 md:pb-22`.
    - Grid `minmax(0,2fr) | minmax(0,1fr)` from `md`, gaps 72px / 48px.
    - **Left (`max-w-[660px]`, gap 28px):** h2 "You will be asked about" (26px), the step list, "Before you start" (22px h2 + 18px/1.6 paragraph).
    - **Right:** the side column (4px brand top rule, `pt-[18px]`, gap 22px): "Questions about the survey" and "College staff", h2 19px, text 16px.
- **Survey** (`/survey`, every step including done): the **guided split** (`SurveyShell`, chosen 2026-11-24, Option C).
  - `lg` and up: grid `380px | minmax(0,1fr)`.
    - Left, the ink step rail, `sticky top-0 h-svh`, padding `36px 40px`, rows `auto 1fr auto`, gap 40px: brand link, step list, note.
    - Right, the white pane, rows `1fr auto`: `main` padding `40px 72px 64px` holding a `max-w-[640px]` column, then a one-line footer.
  - Below `lg`: no rail. An ink step bar opens the pane (padding `12px 16px 16px`, gap 12px):
    - Row 1: seal 30px + "Graduate Tracer" (+ "Sample data" chip in demo mode).
    - Row 2: "Step n of 3" (white, 600) left and the step title (`#d1d5db`) right. Privacy and check show the title only.
    - Row 3: three 5px bars, white up to the current step, `#374151` after. Hidden on done.
  - Then `main` padding `16px 16px 40px` (`sm`: 32px sides).
  - Rhythm inside the pane: Back link, "Step n of 3" (17px muted, `lg` only, because the bar says it below `lg`), h1 (32/40px), questions 36px apart, then the main button (full width below `sm`).
- **Admin**: a 64px top bar with the seal, real nav links (current page = maroon underline), then the page on the `band` ground inside `min(100% - 32px, 1312px)`. Content is a 12-column grid at `lg`, stacking to one column below.
- **Admin sign-in**: a split screen at `lg` and up: the real campus aerial photo (`campus-aerial-*.jpg`) with the seal and service name on the left, the 400px form column on the right with a link back to the survey and the RA 10173 privacy line. Below `lg` the photo becomes a 196–240px band above the form. The photo settles once on load (`.photo-settle`).
- **Tables scroll inside their own rounded box** (`overflow-x-auto`), never widening the page; parents carry `min-w-0` so a wide table never breaks the shell at 320–768px.
- Mobile-first; breakpoints are structural (stack columns, let the table scroll), never fluid type. 44px minimum touch targets on the survey and standalone links.

## Elevation & Depth

Flat. Depth comes from **1px hairlines and one ground step** (white card on `band` page), not shadows. The only shadows are: the primary button's `inset 0 -2px 0 rgb(0 0 0/0.18)` press affordance, and dialog overlays (`0 24px 64px -16px rgb(17 24 39/0.35)` over a `rgb(17 24 39/0.45)` backdrop). No decorative shadows, gradients or blur. The only gradients allowed:
- subtle chart fills
- the ink legibility scrim behind the name on the sign-in photo
- the start page's `.hero-scrim` (`index.css`):
  - **Phone:** bottom-up ink 0.92 → 0.78 at 45% → 0.3 at 75% → 0.5 at the top.
  - **From `md`:** left-to-right ink 0.82 → 0.62 at 42% → 0.08 at 72%, plus a vertical layer of 0.55 at the bottom and 0.45 at the top.

The Start now button's press shadow is `inset 0 -3px 0 rgb(0 0 0/0.25)`.

## Shapes

Radius scale `sm 6 / md 8 / lg 10 / xl 12`, `full` for pills (chips, tags, page numbers, progress bars, step markers). Controls, buttons and answer tiles use `md`; cards, the privacy notice panel and the done panel use `lg`; dialogs `xl`. **No one-sided rounded borders**: an inset notice uses a square left accent bar (`border-l-[6px]`, no radius), never a bar on a rounded box. Focus ring: `3px solid brand`, `2px` offset, never animated.

## Components

- **Buttons** (`frontend/src/components/kit.tsx`): `primary` (maroon, one per view for the main action), `secondary` (white, bordered), `ghost`, `danger`, `ghost-danger`. Sizes sm/md/lg; `loading` shows a spinner and sets `aria-busy`. Full set of states: hover, focus-visible, active (press), disabled.
- **Fields**: `TextField`, `SelectField`, `Radios` wrap native `input`/`select`/`radio`. Label above the control; hint below the label; error above the control in `danger`, with a 4px left accent (GOV.UK). `aria-invalid` and `aria-describedby` wired. `ErrorSummary` sits at the top of a failed form, focused, linking each field. `PasswordField` adds a Show/Hide button inside the field (`aria-pressed`, `aria-controls`).
- **Answer tiles** (`Radios`, survey only): every option is a whole tappable tile, never a bare radio on text.
  - **Tile:** `min-h-14` (56px), `px-4 py-2.5`, `border-2 border-line-strong`, `rounded-md`, white, 17px ink text, `gap-3.5`.
  - **Radio:** native, 22px, `accent-brand`.
  - **States:** hover `border-ink-2`; picked `border-brand bg-brand-50` (via `has-checked:`); keyboard focus puts the 3px gold ring on the tile (`has-focus-visible:`), not on the dot.
  - **Layout:** options sit `gap-2.5` apart. `inline` groups (Yes/No, Philippines/Abroad) are two equal tiles side by side from `sm` (`max-w-[440px]`), stacked below.
  - **Hint and error:** an option hint is a second line in 15px muted. The group error keeps the square `border-l-4 border-danger pl-4` on the fieldset.
  - **Consent:** the consent checkbox is the same tile: `items-start`, `py-3.5`, 24px checkbox.
  - **Loading:** skeletons are tile-height (`h-14`, up to 440px wide).
- **Start now button** (start page only, a link styled as the page's one big action):
  - **Size and shape:** `h-14` (56px), `px-7`, `rounded-md`, `bg-brand`, white 20px bold.
  - **Arrow:** the GOV.UK chevron SVG (16×20), which moves 3px right on hover (200ms ease-out).
  - **States:** hover `bg-brand-hover`; press `translate-y-px` and no shadow; **gold** focus ring, because maroon would vanish on the photo.
  - **Width:** full width below `md`.
- **Step list** (start page): `ol` labelled by its h2, `border-t border-line`.
  - **Rows:** grid `36px | 1fr`, gap 16px, `py-4`, `border-b border-line`.
  - **Number:** an `aria-hidden` 36px circle, `border-2 border-brand text-brand` 16px bold tabular.
  - **Text:** title 18px/1.3 600, description 16px `ink-2`.
  - **Use:** only for the survey's real three-step sequence.
- **`SiteFooter`** (`frontend/src/site/SiteLayout.tsx`): the public footer (service line, Privacy notice, Staff sign-in). It takes an optional `credit` line, 13px `faint`, for photo credits; credits never sit under a picture.
- **Survey shell** (`frontend/src/site/SurveyShell.tsx`): the frame for `/survey`, described under Layout.
  - **Step list:** `ol aria-label="Survey steps"` with five steps: Before you start / About you / Your degree / Your work / Check your answers. Each step has a 14px `#9ca3af` line under it: "Privacy notice and consent", "Name, email and year you graduated", "College, program and major", "Work and further studies", "Review, then submit".
  - **Markers:** 28px circles with a 2px border, 13px bold. A 2px connector runs between markers, `#9ca3af` after a done step and `#374151` otherwise.
    - **Done:** white disc, ink SVG tick; title `#e5e7eb`.
    - **Now:** white ring on ink, white number, `0 0 0 4px rgb(255 255 255/.14)` halo; title white; `aria-current="step"`.
    - **Next:** `#4b5563` ring, `#9ca3af` number and title.
    - Every state carries a visually hidden " (done)" or " (current step)" after the title.
  - **Rail note:** "About 5 minutes. Your answers stay in this browser tab until you submit." On done it reads "Thank you for taking part." The gold "Sample data" chip sits under it in demo mode.
  - **Pane footer:** one line, `border-t border-line`, 14px faint: "Ilocos Sur Polytechnic State College · Sta. Maria campus" + a "Privacy notice" link.
- **Privacy notice panel** (survey's first step): `rounded-lg border border-line bg-band px-6 py-5` with an h2 "Privacy notice" and `PrivacyPoints`. Full hairline border, no one-sided bar.
- **Check answers rows**: `dl` rows, 17px. From `sm`, columns `38% | 1fr | auto` (term, value, Change). Below `sm`, the term spans the row and the value and Change share the next line. Values wrap anywhere (long emails).
- **Done panel**: `rounded-lg border-2 border-[#bbe5c9] bg-ok-50 p-7`, a 44px `ok` disc with a white SVG tick, the focused h1 "Survey complete", and a 19px `#14532d` thank-you line. "What happens next" follows on white.
- **Charts** (`frontend/src/components/charts.tsx`): HTML/CSS only (no chart library). `GroupedBars`, `StackedBar`, `Meter` — **every bar is labelled with its value**, color is never the only cue, and each chart carries a `role="img"` text description. Series: maroon + gold (+ neutral for a third).
- **Tables**: sortable `SortHeader` sets `aria-sort` and a rotating caret; rows link out via a real link in the last cell, not a row click. Paging keeps page numbers + Prev/Next; a page-size select.
- **Dialogs**: native `<dialog>` (`showModal`) for confirm-delete and the programs CRUD — focus trap, Escape to close, focus returns to the opener. Never a hand-rolled modal.
- **Feedback**: `Skeleton` for loading (not spinners mid-content), `EmptyState` that teaches the next action, `ErrorState` with a retry, `react-hot-toast` for transient confirmations.
- **Chips/tags**: `Chip` (gold "Sample data", neutral, ok, danger), `tag-yes`/`tag-no` in the respondents table.

## Do's and Don'ts

- **Do** keep one maroon accent and one gold data series; let neutrals and whitespace do the work.
- **Do** label every chart value and give every control its full state set (hover, focus, disabled, loading, error).
- **Do** use native elements (`dialog`, `select`, radios, constraint validation) so keyboard, screen-reader and autofill behavior come free.
- **Do** respect `prefers-reduced-motion` (the global reset neutralizes animation).
- **Do** make every survey answer a whole tappable tile (56px+), with the focus ring and the picked state on the tile.
- **Do** show where the graduate is: the rail at `lg`, the step bar below it, and "Step n of 3" in words, never color alone.
- **Do** use photographs only of real places, with alt text that says exactly what and where they are, and a credit in the footer.
  - The start page shows Santa Maria's church because it is the town's landmark, never as "the campus".
  - Never present `ispsc_campus_hero.jpg` (not ISPSC) or `bg.jpg` (watermarked, likely another campus) as the college.
- **Don't** use red for a plain "No" answer — red is reserved for problems and destructive actions.
- **Don't** put a one-sided accent bar on a rounded box, add decorative shadows/gradients, or reach for a second accent color.
- **Don't** add a charting or component library; the CSS charts and the native-first kit are the system.
- **Don't** let a wide table widen the page — it scrolls inside its own box.
