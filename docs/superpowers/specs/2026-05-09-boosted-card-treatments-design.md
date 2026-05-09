# Boosted Card Treatments — Design

**Date:** 2026-05-09
**Scope:** Visual rebuild of 6 facet-component renderers + their CSS in the public pitch view.

---

## Why

After the component-per-facet refactor, six of the seven facet components rendered as visually similar glass cards differing only in inner content arrangement. Only `node-graph` (dark Obsidian panel) felt distinct. Specifically, `timeline-strip` was a list of items with marker dots rather than the literal horizontal timeline graphic the spec called for.

Goal: make each card a visually distinct *kind of artifact* without abandoning the cohesive glass workspace aesthetic.

## Direction (locked from brainstorm)

**A. Boost the cards.** Every component keeps the glass card frame. The inside escalates per component — bigger typography, stronger hierarchy, literal graphics where appropriate.

Rejected directions:
- Hybrid (some components break out of the card frame). Breaks workspace cohesion.
- Everything breaks out (no cards). Loses the "workspace of facets" mental model.

## What does NOT change

- **Architecture** — component-per-facet stays. LLM still assigns one of seven `componentType` values per facet. Public view assembles them vertically.
- **Data shapes** — `lib/types/pitch.ts` Facet interface unchanged. No schema migration needed.
- **LLM prompt + schema** — `lib/gemini/facet-extractor.ts` and `lib/schemas/extraction.ts` untouched.
- **Glass frame primitive** — every component still uses the `.cmp` base class (glass backdrop, border, shadow, eyebrow at top).
- **Register tinting** — `--reg-glass-fill`, `--reg-accent`, `--reg-display`, `--reg-body` still drive per-register customization. Vision-led still warm-cream + Fraunces, builder-led still cool + Bricolage.
- **Public view flow** — vertical stack with full-width rows for `node-graph` / `metric-grid` / `timeline-strip` / `quote-manifesto`, paired-cell rows for `chapter-spread` / `skill-constellation` / `facet-card`.
- **Workspace** — no changes to workspace UI; manifest panel + facet card editing surface stay as-is.
- **Share / store / persistence** — unchanged.
- **Identity-stripping + safeguards** — unchanged.

## What changes

### 1. quote-manifesto

The quote sentence becomes the dominant visual element.

- Display type: 30px, italic, weight 400, line-height 1.1, letter-spacing -0.015em
- Color: `var(--ink)`
- Open/close quote glyphs in `var(--reg-accent)` color
- Remove the `title` heading from the rendered output. The quote IS the title.
- 3px solid `var(--reg-accent)` left border on the card
- Padding: 26px / 28px
- If `facet.content` differs from `facet.quote`, render content as small caption text below quote in `var(--muted)`. Otherwise omit.

### 2. metric-grid

First metric becomes a hero, remaining metrics become satellites.

- Hero metric:
  - Value: 72px Bricolage / Fraunces (display font), weight 500, line-height 0.9, letter-spacing -0.035em, color `var(--reg-accent)`
  - Label: 14px display font, weight 500, color `var(--ink)`
  - Context: 10px mono caps, `var(--muted)`
  - Layout: 2-column grid, value | label+context aligned to baseline
- Satellites (metrics 2-N):
  - Render below in a 3-column grid (responsive: 2-col below 480px, 1-col below 320px)
  - Value: 22px display, accent color
  - Label: 11px body, muted
  - Separated from hero by a 1px dashed top border, 14px padding
- If only 1 metric, hero only — no satellite section
- `facet.content` becomes a small italic caption at the bottom (optional — keep if present)

### 3. timeline-strip

Replace the vertical `<ol>` marker list with a literal horizontal timeline graphic.

- Container: relative-positioned `<div>` with the line drawn as an absolute pseudo-element
- Line: 1px height, full-width minus 12px gutters at each end, gradient fading at both ends, color `var(--reg-accent)` at 55% opacity
- Events: equal-distribution flex/grid row beneath the line; events centered on each cell
- Per event:
  - Dot: 14px circle, white fill, 1.5px accent border, glowing 12px box-shadow in accent color, sitting on the line
  - Year (eyebrow): 10px mono caps, weight 500, accent color
  - Title: 12px display, weight 500, ink color, max 2 lines
  - Description (content): 10px body, muted, line-height 1.4, max 3 lines
- Responsive: switch to vertical layout at viewport `< 520px`. Line becomes vertical, dots align left, content offsets right of dots.
- Title at top of card (`facet.title`) stays as the section heading above the graphic.

### 4. chapter-spread

Editorial drop cap + 2-column body flow.

- Title: 30px italic display, line-height 1.05, letter-spacing -0.02em, ink color
- Body: 13.5px body font, line-height 1.6, ink-soft color
- Body uses CSS `column-count: 2; column-gap: 22px;` (single column below 600px)
- `::first-letter` styled as drop cap: 56px italic display, weight 500, accent color, `float: left`, padding 4px 8px 0 0, line-height 0.9
- Eyebrow at top remains as section eyebrow (existing pattern)
- Padding: 28px / 30px (slightly more than default for editorial breathing room)

### 5. skill-constellation

Keep flat pill flow but escalate weight differences so hierarchy is visible at a glance.

- Pill weight 1: 11px body, padding 3px / 9px, opacity 0.5, weight 400 — small + faded
- Pill weight 2: 13px body, padding 5px / 13px, opacity 0.85, weight 500 — medium
- Pill weight 3: 16px body, padding 7px / 18px, opacity 1, weight 500 — accent-soft fill, accent border, accent-deep text — visually loudest
- Gap between pills: 6px (tighter than current 8px so the size variation reads more clearly)
- `facet.content` becomes a small caption below pills with a dashed top border (existing behavior, keep)

### 6. facet-card

No changes. Deliberately quiet default. Only used when no other component fits.

### 7. node-graph

No changes. Dark Obsidian panel was already approved and isn't a card-form issue.

## Files touched

| File | Change |
|---|---|
| `styles/components.css` | Rewrite `.cmp-manifesto`, `.cmp-metrics`, `.cmp-timeline`, `.cmp-chapter`, `.cmp-pill-w*` blocks; keep `.cmp` base + `.cmp-facet-card` + `.cmp-obsidian` |
| `components/public-view/components/QuoteManifesto.tsx` | Drop the `<h3 class="cmp-title">` from JSX; quote becomes the heading |
| `components/public-view/components/MetricGrid.tsx` | Split first metric as hero, render rest as satellites |
| `components/public-view/components/TimelineStrip.tsx` | Replace `<ol>` markup with horizontal graphic structure |
| `components/public-view/components/ChapterSpread.tsx` | No JSX change (CSS handles it) |
| `components/public-view/components/SkillConstellation.tsx` | No JSX change (CSS handles it) |
| `components/public-view/components/FacetCard.tsx` | No change |
| `components/public-view/components/NodeGraphFacet.tsx` | No change |

No new files. No deletions. No type or schema changes.

## Testing

Manual smoke-test against demo data after each component CSS change. Public view at `/p/:id` with all 7 component types active should show:
- Quote manifesto reads as a *quote*, not a card with text in it
- Metric grid has a clearly dominant hero number
- Timeline reads as a horizontal graphic, not a list
- Chapter spread reads as editorial (drop cap visible)
- Constellation pill sizes vary visibly
- Node-graph dark panel unchanged
- Facet-card minimal as fallback

Cross-register check: regenerate as `founder→investor` (vision-led) — every component should pick up Fraunces serif and warm-cream tinting via the existing register CSS variables.

## Risks

- **Timeline at narrow widths.** 4+ events at <520px will collide. Mitigation: vertical fallback via media query (specified above). Tested mentally; horizontal direction holds for laptop/desktop.
- **Drop-cap interaction with `column-count`.** `::first-letter` works inside multi-column flow in Chrome/Safari/Firefox; verified in mockup. If it breaks in a specific browser, fall back to single-column.
- **Hero metric on a long value (e.g. 17-character context line).** 72px hero may force wrap on narrow cards. Mitigation: max-width on the hero label/context columns, ellipsis at 2 lines if needed.

## Out of scope

- Changes to the workspace UI (no work on the editing surface or manifest panel).
- Changes to the LLM prompts (we're not asking the LLM to produce different data — same shapes).
- New component types beyond the existing seven.
- Per-register custom layouts (registers tint via CSS vars, not bespoke layouts).
- Animations / transitions on component reveal.
