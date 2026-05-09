# Boosted Card Treatments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the visual treatment of 5 facet components (quote-manifesto, metric-grid, timeline-strip, chapter-spread, skill-constellation) so each one reads as a distinct kind of artifact while still sitting inside a glass card.

**Architecture:** Pure CSS rewrites in `styles/components.css` for all 5, plus three small JSX edits in the React components for quote (drop title), metric (split hero + satellites), and timeline (replace `<ol>` markers with horizontal graphic). No type/schema/LLM changes. The glass card primitive (`.cmp` base class) and per-register variables (`--reg-glass-fill`, `--reg-accent`, `--reg-display`) stay intact and drive register tinting automatically.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind 4 (used for utility CSS only — design system is hand-rolled in `styles/components.css`). Dev server runs at `http://localhost:3000`. Hot-reload picks up CSS edits without restart.

**Spec:** `docs/superpowers/specs/2026-05-09-boosted-card-treatments-design.md`

---

## File Map

| File | Change | Lines |
|---|---|---|
| `styles/components.css` | Rewrite 5 component blocks | `.cmp-manifesto`, `.cmp-metrics`, `.cmp-timeline`, `.cmp-chapter`, `.cmp-pill-w*` |
| `components/public-view/components/QuoteManifesto.tsx` | Drop `<h3 className="cmp-title">` | full file |
| `components/public-view/components/MetricGrid.tsx` | Split first metric as hero, rest as satellites | full file |
| `components/public-view/components/TimelineStrip.tsx` | Replace `<ol>` markup with horizontal graphic | full file |
| `components/public-view/components/ChapterSpread.tsx` | No JSX change (CSS only) | — |
| `components/public-view/components/SkillConstellation.tsx` | No JSX change (CSS only) | — |

No new files. No deletions.

---

## Testing Approach

This codebase has no visual-regression test suite. Validation is **manual smoke-testing in a browser**:

1. Generate a demo pitch (one-time setup, Task 0) and bookmark its `/p/:id` URL
2. After each component change, refresh the URL and verify that component renders as the spec describes
3. Final task does a cross-component sweep and a register switch (builder-led → vision-led)

If a smoke check fails, **don't commit** — fix the CSS or JSX, re-check, then commit.

---

## Task 0: Setup smoke-test pitch

**Files:** none (just generating data and capturing IDs).

- [ ] **Step 1: Confirm dev server is up**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`

If not 200, run: `cd /Users/karmenyip/storylayer && npm run dev` and wait for "Ready in".

- [ ] **Step 2: Generate a builder-led pitch with mixed components**

Run:
```bash
curl -s -X POST http://localhost:3000/api/generate \
  -H 'content-type: application/json' \
  -d "$(curl -s http://localhost:3000/api/demo-data | python3 -c 'import sys,json; d=json.load(sys.stdin); print(json.dumps({"sources": d["sources"], "storytellerRole": "applicant", "listenerRole": "startup", "knownName": d.get("knownName","")}))')" \
  -o /tmp/pitch-builder.json -w "%{http_code} · %{time_total}s\n"
```
Expected: `200` after ~20-30s.

- [ ] **Step 3: Verify the pitch has the components we need to smoke test**

Run:
```bash
python3 -c "
import json
d = json.load(open('/tmp/pitch-builder.json'))
counts = {}
for f in d['facets']:
    counts[f['componentType']] = counts.get(f['componentType'], 0) + 1
print(counts)
"
```
Expected output includes at least: `quote-manifesto`, `metric-grid`, `chapter-spread`, `skill-constellation`. (`timeline-strip` may or may not appear — Step 5 handles it.)

- [ ] **Step 4: Share the pitch and capture the public URL**

Run:
```bash
curl -s -X POST http://localhost:3000/api/share \
  -H 'content-type: application/json' \
  -d @/tmp/pitch-builder.json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'http://localhost:3000{d[\"url\"]}')" > /tmp/pitch-url.txt
cat /tmp/pitch-url.txt
```
Expected: a URL like `http://localhost:3000/p/abc12345`. Save this — it's your smoke-test target.

- [ ] **Step 5: If timeline-strip is missing from the pitch, create a synthetic one**

Check the manifest output from Step 3. If `timeline-strip` isn't listed, post a synthetic pitch that includes one:

```bash
curl -s -X POST http://localhost:3000/api/share \
  -H 'content-type: application/json' \
  -d '{
    "storytellerRole":"applicant","listenerRole":"startup",
    "register":"builder-led","archetype":"arc-of-pivots","outstandingCharacteristic":"journey-and-pivots",
    "reasoning":"synthetic test pitch for timeline-strip smoke check",
    "facets":[
      {"id":"formative-experience","title":"Through the work","content":"From journalism to product, four chapters that compound.","componentType":"timeline-strip","events":[
        {"eyebrow":"2017","title":"NYU journalism","content":"Covering NYC tech for the school paper."},
        {"eyebrow":"2020","title":"IBM Watson","content":"Designed the assistant onboarding."},
        {"eyebrow":"2022","title":"Preface","content":"Grew weekly actives 4k → 120k."},
        {"eyebrow":"2024","title":"Now","content":"Tools for legible narrative."}
      ]}
    ]
  }' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'http://localhost:3000{d[\"url\"]}')" > /tmp/pitch-timeline-url.txt
cat /tmp/pitch-timeline-url.txt
```
Expected: a URL. Save it.

- [ ] **Step 6: Open the smoke-test URL in a browser**

Open the URL from `/tmp/pitch-url.txt`. Pick all available facets in the onboarding modal (`Select all` if present, otherwise click each chip). Click "See the pitch →".

You should see the pitch rendered with the **current** (unchanged) component treatments. This is your before-state.

No commit for this task — it's just setup.

---

## Task 1: quote-manifesto — quote dominates the card

**Files:**
- Modify: `components/public-view/components/QuoteManifesto.tsx`
- Modify: `styles/components.css` (the `.cmp-manifesto` block)

- [ ] **Step 1: Drop the redundant title from QuoteManifesto JSX**

Read the current file: `components/public-view/components/QuoteManifesto.tsx`. Replace its entire contents with:

```tsx
import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function QuoteManifesto({ facet }: { facet: Facet }) {
  const quote = facet.quote ?? facet.content;
  const showCaption =
    facet.quote && facet.content && facet.quote.trim() !== facet.content.trim();
  return (
    <article className="cmp cmp-manifesto">
      <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
      <blockquote className="cmp-manifesto-quote">{quote}</blockquote>
      {showCaption && <p className="cmp-manifesto-caption">{facet.content}</p>}
    </article>
  );
}
```

(Note: this drops the title tag and the conditional `facet.quote !== facet.content` check is now also trim-aware. If the body and quote match after trim, no caption.)

- [ ] **Step 2: Rewrite the `.cmp-manifesto` CSS block**

Open `styles/components.css`. Find the existing block starting at `/* quote-manifesto */` (search for `.cmp-manifesto`). Replace from that comment through the `.cmp-manifesto-caption { ... }` rule (everything in the manifesto block) with:

```css
/* quote-manifesto */
.cmp-manifesto {
  padding: 26px 28px;
  border-left: 3px solid var(--reg-accent, var(--accent));
}
.cmp-manifesto-quote {
  font-family: var(--reg-display, var(--display-font));
  font-style: italic;
  font-weight: 400;
  font-size: 30px;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 6px 0 0;
  max-width: 760px;
}
.cmp-manifesto-quote::before {
  content: '"';
  color: var(--reg-accent, var(--accent));
  margin-right: 4px;
  font-style: normal;
}
.cmp-manifesto-quote::after {
  content: '"';
  color: var(--reg-accent, var(--accent));
  margin-left: 2px;
  font-style: normal;
}
.cmp-manifesto-caption {
  margin-top: 14px;
  font-family: var(--reg-body, var(--body-font));
  font-size: 13px;
  color: var(--muted);
  max-width: 600px;
}

@media (max-width: 720px) {
  .cmp-manifesto-quote { font-size: 22px; }
}
```

- [ ] **Step 3: Smoke test in browser**

Refresh the smoke-test URL. Find the `values` and `vision` facets (both should be quote-manifesto in the manifest from Task 0).

**Verify:**
- The card has a 3px solid accent-colored border on the left
- The quote sentence is the visually dominant text in the card (~30px italic display)
- There is no separate title above the quote
- Open and close `"` glyphs are colored in accent (cobalt for builder-led)
- If a caption exists below the quote, it's small and muted

If anything's off, fix and re-check before committing.

- [ ] **Step 4: Commit**

```bash
cd /Users/karmenyip/storylayer
git add components/public-view/components/QuoteManifesto.tsx styles/components.css
git commit -m "feat(quote-manifesto): quote dominates the card

Drop the redundant title; quote sentence becomes the heading. Bump display
italic to 30px with -0.015em tracking, line-height 1.1. Open/close quote
glyphs in accent color. Caption only renders when content meaningfully
differs from the quote."
```

---

## Task 2: metric-grid — hero + satellites

**Files:**
- Modify: `components/public-view/components/MetricGrid.tsx`
- Modify: `styles/components.css` (the `.cmp-metrics` block)

- [ ] **Step 1: Rewrite MetricGrid.tsx to split hero from satellites**

Replace the entire contents of `components/public-view/components/MetricGrid.tsx` with:

```tsx
import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function MetricGrid({ facet }: { facet: Facet }) {
  const metrics = facet.metrics ?? [];
  if (metrics.length === 0) {
    return (
      <article className="cmp cmp-facet-card">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
        <p className="cmp-body">{facet.content}</p>
      </article>
    );
  }
  const [hero, ...satellites] = metrics;
  return (
    <article className="cmp cmp-metrics">
      <div className="cmp-metrics-head">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
      </div>
      <div className="cmp-metrics-hero">
        <div className="cmp-metrics-hero-value">{hero.value}</div>
        <div className="cmp-metrics-hero-text">
          <div className="cmp-metrics-hero-label">{hero.label}</div>
          {hero.context && <div className="cmp-metrics-hero-context">{hero.context}</div>}
        </div>
      </div>
      {satellites.length > 0 && (
        <div className="cmp-metrics-satellites">
          {satellites.map((m, i) => (
            <div key={i} className="cmp-metric-sat">
              <div className="cmp-metric-sat-value">{m.value}</div>
              <div className="cmp-metric-sat-label">{m.label}</div>
              {m.context && <div className="cmp-metric-sat-context">{m.context}</div>}
            </div>
          ))}
        </div>
      )}
      {facet.content && <p className="cmp-metrics-caption">{facet.content}</p>}
    </article>
  );
}
```

- [ ] **Step 2: Rewrite the `.cmp-metrics` CSS block**

Open `styles/components.css`. Find the `/* metric-grid */` block (search for `.cmp-metrics`). Replace the entire block (from the `/* metric-grid */` comment through `.cmp-metrics-caption { ... }`) with:

```css
/* metric-grid */
.cmp-metrics { padding: 24px 26px; }
.cmp-metrics-head { margin-bottom: 14px; }
.cmp-metrics-hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px 24px;
  align-items: end;
  margin-top: 4px;
}
.cmp-metrics-hero-value {
  font-family: var(--reg-display, var(--display-font));
  font-size: 72px;
  font-weight: 500;
  line-height: 0.9;
  letter-spacing: -0.035em;
  color: var(--reg-accent, var(--accent));
}
.cmp-metrics-hero-text { padding-bottom: 6px; max-width: 320px; }
.cmp-metrics-hero-label {
  font-family: var(--reg-display, var(--display-font));
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
}
.cmp-metrics-hero-context {
  font-family: var(--reg-mono, var(--mono-font));
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-top: 2px;
}
.cmp-metrics-satellites {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed rgba(28, 48, 110, 0.12);
}
.cmp-metric-sat { display: flex; flex-direction: column; gap: 2px; }
.cmp-metric-sat-value {
  font-family: var(--reg-display, var(--display-font));
  font-size: 22px;
  font-weight: 500;
  color: var(--reg-accent, var(--accent));
  line-height: 1;
}
.cmp-metric-sat-label {
  font-family: var(--reg-body, var(--body-font));
  font-size: 11px;
  color: var(--ink-soft);
}
.cmp-metric-sat-context {
  font-family: var(--reg-mono, var(--mono-font));
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}
.cmp-metrics-caption {
  font-family: var(--reg-body, var(--body-font));
  font-size: 13px;
  color: var(--muted);
  border-top: 1px dashed rgba(28, 48, 110, 0.08);
  padding-top: 10px;
  margin-top: 14px;
  font-style: italic;
}

@media (max-width: 480px) {
  .cmp-metrics-satellites { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cmp-metrics-hero-value { font-size: 56px; }
}
@media (max-width: 320px) {
  .cmp-metrics-satellites { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Smoke test in browser**

Refresh the smoke-test URL. Find the `shipped-work` facet (and `fundraising-track` if present). Both should be metric-grid.

**Verify:**
- The first metric value renders huge (~72px display type) in accent color
- Label sits to the right of the hero number, baseline-aligned
- Context (if present) renders as small mono caps below the label
- 2nd through Nth metrics render below in a 3-column grid, separated by a dashed top border, with smaller (22px) accent values
- Optional content caption renders italic and muted at the bottom

If only one metric exists (e.g. fundraising-track with one entry), the satellites section should be hidden — just the hero. Verify.

- [ ] **Step 4: Commit**

```bash
cd /Users/karmenyip/storylayer
git add components/public-view/components/MetricGrid.tsx styles/components.css
git commit -m "feat(metric-grid): hero + satellites

First metric becomes a 72px accent-colored hero with label and context.
Remaining metrics render below as 3-column satellites separated by a
dashed border. Falls back gracefully when only one metric exists.
Responsive grid drops to 2 cols < 480px and 1 col < 320px."
```

---

## Task 3: timeline-strip — literal horizontal graphic

**Files:**
- Modify: `components/public-view/components/TimelineStrip.tsx`
- Modify: `styles/components.css` (the `.cmp-timeline` block)

- [ ] **Step 1: Rewrite TimelineStrip.tsx with horizontal layout**

Replace the entire contents of `components/public-view/components/TimelineStrip.tsx` with:

```tsx
import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function TimelineStrip({ facet }: { facet: Facet }) {
  const events = facet.events ?? [];
  if (events.length === 0) {
    return (
      <article className="cmp cmp-facet-card">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
        <p className="cmp-body">{facet.content}</p>
      </article>
    );
  }
  return (
    <article className="cmp cmp-timeline">
      <div className="cmp-timeline-head">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
      </div>
      <div className="cmp-timeline-graphic" data-count={events.length}>
        <div className="cmp-timeline-line" />
        <div className="cmp-timeline-row">
          {events.map((e, i) => (
            <div key={i} className="cmp-timeline-event">
              <div className="cmp-timeline-dot" />
              <div className="cmp-timeline-year">{e.eyebrow}</div>
              <div className="cmp-timeline-event-title">{e.title}</div>
              <div className="cmp-timeline-event-content">{e.content}</div>
            </div>
          ))}
        </div>
      </div>
      {facet.content && <p className="cmp-timeline-caption">{facet.content}</p>}
    </article>
  );
}
```

- [ ] **Step 2: Rewrite the `.cmp-timeline` CSS block**

Open `styles/components.css`. Find the `/* timeline-strip */` block. Replace the entire existing block (from `/* timeline-strip */` through `.cmp-timeline-content { ... }`) with:

```css
/* timeline-strip — literal horizontal graphic */
.cmp-timeline { padding: 24px 28px 22px; }
.cmp-timeline-head { margin-bottom: 14px; }
.cmp-timeline-graphic {
  position: relative;
  padding: 18px 8px 4px;
}
.cmp-timeline-line {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 28px;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--reg-accent, var(--accent)) 8%,
    var(--reg-accent, var(--accent)) 92%,
    transparent 100%);
  opacity: 0.55;
  pointer-events: none;
}
.cmp-timeline-row {
  display: grid;
  grid-template-columns: repeat(var(--tl-cols, 4), 1fr);
  gap: 10px;
  position: relative;
}
.cmp-timeline-graphic[data-count="2"] .cmp-timeline-row { grid-template-columns: repeat(2, 1fr); }
.cmp-timeline-graphic[data-count="3"] .cmp-timeline-row { grid-template-columns: repeat(3, 1fr); }
.cmp-timeline-graphic[data-count="4"] .cmp-timeline-row { grid-template-columns: repeat(4, 1fr); }
.cmp-timeline-graphic[data-count="5"] .cmp-timeline-row { grid-template-columns: repeat(5, 1fr); }
.cmp-timeline-graphic[data-count="6"] .cmp-timeline-row { grid-template-columns: repeat(6, 1fr); }

.cmp-timeline-event {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 4px;
}
.cmp-timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: 1.5px solid var(--reg-accent, var(--accent));
  box-shadow: 0 0 12px rgba(59, 91, 255, 0.5);
  margin-bottom: 12px;
  z-index: 2;
  position: relative;
}
.cmp-timeline-year {
  font-family: var(--reg-mono, var(--mono-font));
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--reg-accent, var(--accent));
}
.cmp-timeline-event-title {
  font-family: var(--reg-display, var(--display-font));
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--ink);
  margin-top: 4px;
  line-height: 1.2;
}
.cmp-timeline-event-content {
  font-family: var(--reg-body, var(--body-font));
  font-size: 11px;
  line-height: 1.45;
  color: var(--ink-soft);
  margin-top: 4px;
}
.cmp-timeline-caption {
  font-family: var(--reg-body, var(--body-font));
  font-size: 13px;
  color: var(--muted);
  margin-top: 14px;
  border-top: 1px dashed rgba(28, 48, 110, 0.08);
  padding-top: 10px;
  font-style: italic;
}

/* Below 520px, switch to vertical: line moves to the left, events stack */
@media (max-width: 520px) {
  .cmp-timeline-graphic { padding: 6px 8px 4px 30px; }
  .cmp-timeline-line {
    left: 6px;
    right: auto;
    top: 12px;
    bottom: 12px;
    width: 1px;
    height: auto;
    background: linear-gradient(180deg,
      transparent 0%,
      var(--reg-accent, var(--accent)) 8%,
      var(--reg-accent, var(--accent)) 92%,
      transparent 100%);
  }
  .cmp-timeline-row {
    grid-template-columns: 1fr !important;
    gap: 16px;
  }
  .cmp-timeline-event {
    align-items: flex-start;
    text-align: left;
    position: relative;
    padding-left: 18px;
  }
  .cmp-timeline-dot {
    position: absolute;
    left: -22px;
    top: 4px;
    margin-bottom: 0;
  }
}
```

- [ ] **Step 3: Smoke test in browser**

If the main pitch URL has a timeline-strip facet, refresh that. Otherwise, open the synthetic URL from Task 0 Step 5.

**Verify:**
- The timeline reads as a horizontal graphic, NOT a list of items
- A 1px line with gradient fade at both ends runs across the card
- Each event has a glowing dot on the line, evenly distributed
- Year (eyebrow) renders in mono caps in accent color BELOW its dot
- Title and description render below the year, centered
- Resize the browser window to ~480px wide — the layout should switch to vertical (line moves left, dots align left, content reads down)

If the dot row doesn't sit on the line, check that `top: 28px` on `.cmp-timeline-line` aligns with where the dot appears in the row — the row's first item is the dot with `margin-bottom: 12px`, so the line should align with the dot center. Adjust if off.

- [ ] **Step 4: Commit**

```bash
cd /Users/karmenyip/storylayer
git add components/public-view/components/TimelineStrip.tsx styles/components.css
git commit -m "feat(timeline-strip): literal horizontal graphic

Replace the vertical <ol> marker list with a horizontal timeline:
gradient-faded line, evenly distributed glowing dots, year + title +
description stacked below each dot. Grid columns adapt to event count
(2-6). Switches to vertical layout below 520px viewport."
```

---

## Task 4: chapter-spread — drop cap + 2 columns

**Files:**
- Modify: `styles/components.css` (the `.cmp-chapter` block)

No JSX changes — the existing markup already renders eyebrow + title + body, which is all we need.

- [ ] **Step 1: Rewrite the `.cmp-chapter` CSS block**

Open `styles/components.css`. Find the `/* chapter-spread */` block. Replace the entire existing block (from `/* chapter-spread */` through `.cmp-chapter-body { ... }`) with:

```css
/* chapter-spread — editorial drop cap + 2-column body */
.cmp-chapter {
  padding: 28px 30px;
}
.cmp-chapter-title {
  font-family: var(--reg-display, var(--display-font));
  font-style: italic;
  font-weight: 500;
  font-size: 30px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 4px 0 14px;
}
.cmp-chapter-body {
  font-family: var(--reg-body, var(--body-font));
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--ink-soft);
  column-count: 2;
  column-gap: 22px;
}
.cmp-chapter-body::first-letter {
  font-family: var(--reg-display, var(--display-font));
  font-style: italic;
  font-size: 56px;
  font-weight: 500;
  float: left;
  line-height: 0.9;
  padding: 4px 8px 0 0;
  color: var(--reg-accent, var(--accent));
}

@media (max-width: 600px) {
  .cmp-chapter-title { font-size: 24px; }
  .cmp-chapter-body { column-count: 1; }
  .cmp-chapter-body::first-letter { font-size: 44px; }
}
```

- [ ] **Step 2: Smoke test in browser**

Refresh the smoke-test URL. Find the `formative-experience` and/or `origin` facets — both should be chapter-spread.

**Verify:**
- Title is 30px italic display
- Body text flows in 2 columns with a 22px gutter
- The first letter of the body is a large (56px) italic accent-colored drop cap, floated to the left, wrapping the surrounding text
- Resize to ~500px wide — drop cap shrinks to 44px and body becomes single column

If the drop cap doesn't appear, check that the body content actually starts with a regular letter (not an emoji or quote) and that no inline element wraps it (`::first-letter` only targets the first text node).

- [ ] **Step 3: Commit**

```bash
cd /Users/karmenyip/storylayer
git add styles/components.css
git commit -m "feat(chapter-spread): editorial drop cap + 2-column body

Title bumps to 30px italic display with -0.02em tracking. Body flows in
two columns with a 22px gutter. ::first-letter renders as a 56px italic
accent-colored drop cap floated left. Drops to single column and 44px
drop cap below 600px viewport."
```

---

## Task 5: skill-constellation — visible weight hierarchy

**Files:**
- Modify: `styles/components.css` (the `.cmp-pill` and `.cmp-pill-w*` blocks)

No JSX changes.

- [ ] **Step 1: Rewrite the `.cmp-constellation` and `.cmp-pill*` CSS blocks**

Open `styles/components.css`. Find the `/* skill-constellation */` block. Replace the entire existing block (from `/* skill-constellation */` through `.cmp-constellation-caption { ... }`) with:

```css
/* skill-constellation — pills with weight = visual hierarchy */
.cmp-constellation { padding: 22px 24px; }
.cmp-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 12px 0 14px;
}
.cmp-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid var(--reg-glass-edge, var(--glass-edge-soft));
  border-radius: 999px;
  font-family: var(--reg-body, var(--body-font));
  color: var(--ink);
  transition: all 0.18s ease;
  white-space: nowrap;
}
.cmp-pill-w1 {
  font-size: 11px;
  padding: 3px 9px;
  opacity: 0.5;
  font-weight: 400;
}
.cmp-pill-w2 {
  font-size: 13px;
  padding: 5px 13px;
  opacity: 0.85;
  font-weight: 500;
}
.cmp-pill-w3 {
  font-size: 16px;
  padding: 7px 18px;
  opacity: 1;
  font-weight: 500;
  background: var(--reg-accent-soft, var(--accent-soft));
  border-color: var(--reg-accent, var(--accent));
  color: var(--reg-accent, var(--accent));
}
.cmp-constellation-caption {
  border-top: 1px dashed rgba(28, 48, 110, 0.08);
  padding-top: 12px;
  margin-top: 4px;
  font-family: var(--reg-body, var(--body-font));
  font-size: 13px;
  color: var(--muted);
  font-style: italic;
}
```

- [ ] **Step 2: Smoke test in browser**

Refresh the smoke-test URL. Find the `how-i-work` facet — should be skill-constellation.

**Verify:**
- Pills have three visibly distinct weights: weight-3 are the largest with accent-colored fill, weight-2 are medium, weight-1 are smallest and faded (~50% opacity)
- The hierarchy reads instantly without having to compare carefully
- A muted italic caption below pills (if `facet.content` is non-empty) reads quietly

- [ ] **Step 3: Commit**

```bash
cd /Users/karmenyip/storylayer
git add styles/components.css
git commit -m "feat(skill-constellation): visible weight hierarchy

Pills render at three distinct sizes (16/13/11px) with corresponding
opacity (1/0.85/0.5) and weight (500/500/400). Weight-3 pills get an
accent-soft fill, accent border, and accent-deep text — visually loudest.
Tighter 6px gap so size variation reads at a glance."
```

---

## Task 6: end-to-end smoke test + register switch

No code changes — final verification across all components and both registers.

- [ ] **Step 1: Visit the builder-led pitch URL one more time**

Open the URL from `/tmp/pitch-url.txt`. Pick all available facets. Verify all 5 component types render correctly:

- quote-manifesto: dominant italic quote, accent left border ✓
- metric-grid: 72px hero number + satellites ✓
- timeline-strip: horizontal graphic with line + dots ✓
- chapter-spread: drop cap + 2 columns ✓
- skill-constellation: visible 3-tier weight hierarchy ✓
- node-graph (unchanged): dark obsidian panel ✓
- facet-card (unchanged): minimal default ✓

- [ ] **Step 2: Generate a vision-led pitch and smoke test the register tinting**

Run:
```bash
curl -s -X POST http://localhost:3000/api/generate \
  -H 'content-type: application/json' \
  -d "$(curl -s http://localhost:3000/api/demo-data | python3 -c 'import sys,json; d=json.load(sys.stdin); print(json.dumps({"sources": d["sources"], "storytellerRole": "founder", "listenerRole": "investor", "knownName": d.get("knownName","")}))')" \
  -o /tmp/pitch-vision.json -w "%{http_code}\n"

curl -s -X POST http://localhost:3000/api/share \
  -H 'content-type: application/json' \
  -d @/tmp/pitch-vision.json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'http://localhost:3000{d[\"url\"]}')" > /tmp/pitch-vision-url.txt
cat /tmp/pitch-vision-url.txt
```
Expected: both 200, a URL printed.

- [ ] **Step 3: Open the vision-led URL and verify register tinting flows through**

Open the vision URL. Pick all facets.

**Verify:**
- Background tint shifts subtly to warm cream (rgba(252, 245, 230, 0.55))
- Display type uses Fraunces (serif), body uses Newsreader (serif)
- Accent color is gold (#C9A14A) — drop cap, hero metric, timeline dots, weight-3 pills, quote borders
- All five component treatments still apply correctly with the new tinting

If any treatment looks broken in vision-led specifically (e.g. wrong font, wrong accent), check that the CSS uses `var(--reg-display, ...)`, `var(--reg-body, ...)`, `var(--reg-accent, ...)` — not the global tokens.

- [ ] **Step 4: Type-check + production build sanity**

Run:
```bash
cd /Users/karmenyip/storylayer
npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 5: Push branch**

Run:
```bash
cd /Users/karmenyip/storylayer
git log --oneline -8
git push
```
Expected: 5 component-feature commits since the design-spec commit, all pushed to origin/main.

- [ ] **Step 6: Update README "Built for v1" section to reflect the new component-per-facet model**

Open `README.md`. Find the "Built for v1" section. Replace it with:

```markdown
## Built for v1

- 2 registers fully realised: **builder-led** (cobalt + Bricolage) and **vision-led** (warm cream + Fraunces)
- 7 facet components fully realised — each with a distinct visual treatment inside the glass card frame:
  - **node-graph** — dark Obsidian panel with glowing nodes + verb-phrase edges
  - **metric-grid** — 72px hero number + satellite stats
  - **timeline-strip** — literal horizontal graphic with gradient line + glowing dots
  - **quote-manifesto** — dominant italic display quote with accent left border
  - **skill-constellation** — pills at three weight tiers (size + opacity + accent fill)
  - **chapter-spread** — editorial italic title + drop cap + two-column body
  - **facet-card** — minimal default fallback
- Public view assembles components vertically: full-width rows for visual components, paired cells for prose components
- Mixed layout means same corpus produces different visual rhythms in different registers
```

- [ ] **Step 7: Commit README and push**

```bash
cd /Users/karmenyip/storylayer
git add README.md
git commit -m "docs: update v1 component list with new visual treatments"
git push
```

---

## Self-review notes

- **Spec coverage:** All 7 component changes from the spec are covered. Tasks 1–5 each map to one component. Task 4 (chapter) and Task 5 (constellation) are CSS-only as the spec said. node-graph and facet-card are explicitly skipped per spec ("no changes").
- **Type consistency:** Property names (`metrics`, `events`, `nodes`, `connections`, `skills`, `quote`, `eyebrow`) match `lib/types/pitch.ts`. CSS class names (`cmp-manifesto`, `cmp-metrics-hero-value`, `cmp-timeline-graphic`, `cmp-chapter-body`, `cmp-pill-w1/2/3`) are consistent across CSS and JSX.
- **No placeholders:** Every step has executable commands or full code blocks.
- **Risks acknowledged in spec:** Timeline narrow-width vertical fallback (Task 3 step 2 covers `<520px`), drop-cap with `column-count` (Task 4 step 2 includes the fallback to single-column at `<600px`), hero metric overflow (Task 2 step 2 sets `max-width: 320px` on hero text).
