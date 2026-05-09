# Design System Addendum

**Supersedes the visual-styling sections of `implementation-plan.md` (Sections 1e, 15, 16). Read this with `workspace-glass.html` open as the visual source of truth.**

The aesthetic locked: light blue atmospheric base, glassmorphic surfaces, transparency as conceptual through-line for the identity-stripped, agent-reasoning-shown product. Both the workspace AND the public-view formats render in glass.

---

## Fonts (replaces impl plan §1e)

`app/layout.tsx`:

```tsx
import { Bricolage_Grotesque, Geist, Geist_Mono, Fraunces, Newsreader } from 'next/font/google';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['300','400','500','600']
});
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const fraunces = Fraunces({
  subsets: ['latin'], variable: '--font-fraunces', style: ['normal','italic']
});
const newsreader = Newsreader({
  subsets: ['latin'], variable: '--font-newsreader', style: ['normal','italic']
});

// In <body className={...}> apply all five variables
```

Bricolage = workspace display. Geist = body. Geist Mono = system labels. Fraunces + Newsreader stay loaded — used inside the **vision-led register** specifically.

---

## Global glass tokens (`app/globals.css`)

```css
:root {
  /* Atmosphere */
  --bg-base:        #EEF2FB;
  --bg-deeper:      #DCE6F5;

  /* Ink */
  --ink:            #0A1733;
  --ink-soft:       #1F2C4D;
  --muted:          #5A6B8F;
  --muted-light:    #8B9DBF;

  /* Glass */
  --glass-fill:        rgba(255, 255, 255, 0.55);
  --glass-fill-strong: rgba(255, 255, 255, 0.72);
  --glass-fill-faint:  rgba(255, 255, 255, 0.32);
  --glass-edge:        rgba(255, 255, 255, 0.85);
  --glass-edge-soft:   rgba(255, 255, 255, 0.45);
  --glass-shadow:      0 12px 48px rgba(28, 48, 110, 0.12),
                       0 2px 6px rgba(28, 48, 110, 0.06);
  --glass-shadow-deep: 0 24px 80px rgba(28, 48, 110, 0.18),
                       0 4px 12px rgba(28, 48, 110, 0.08);

  /* Workspace accent (cobalt) */
  --accent:        #3B5BFF;
  --accent-deep:   #2238CC;
  --accent-soft:   rgba(59, 91, 255, 0.12);

  /* Highlight */
  --highlight:     #FFD66B;
}

/* Glass mixin pattern — reuse everywhere a glass surface is needed */
.glass {
  background: var(--glass-fill);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid var(--glass-edge-soft);
  box-shadow: var(--glass-shadow);
  border-radius: 16px;
}

.glass-strong {
  background: var(--glass-fill-strong);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid var(--glass-edge-soft);
}

.glass-faint {
  background: var(--glass-fill-faint);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-edge-soft);
}
```

---

## Atmospheric backdrop (mount once in `app/layout.tsx`)

```tsx
function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />
    </div>
  );
}
```

CSS classes (`globals.css`):

```css
.atmosphere {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
}
.blob {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.7;
  animation: drift 28s ease-in-out infinite alternate;
}
.blob-1 { width: 700px; height: 700px;
  background: radial-gradient(circle, #A4C2F4 0%, transparent 70%);
  top: -200px; left: -150px; }
.blob-2 { width: 600px; height: 600px;
  background: radial-gradient(circle, #C7E9DC 0%, transparent 70%);
  top: 30%; right: -100px; animation-delay: -8s; animation-duration: 34s; }
.blob-3 { width: 550px; height: 550px;
  background: radial-gradient(circle, #DDD4F4 0%, transparent 70%);
  bottom: -100px; left: 25%; animation-delay: -16s; animation-duration: 40s; }
.blob-4 { width: 400px; height: 400px;
  background: radial-gradient(circle, #FFD9CF 0%, transparent 70%);
  top: 60%; left: -80px; animation-delay: -22s; opacity: 0.45; }
@keyframes drift {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(60px, -40px) scale(1.05); }
  100% { transform: translate(-30px, 50px) scale(0.95); }
}
body::before {
  content: ''; position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
  opacity: 0.04; mix-blend-mode: overlay;
}

/* All page content above atmosphere */
.page-content { position: relative; z-index: 2; }
```

The atmosphere renders ONCE at app level. Workspace AND public view inherit it.

---

## Register CSS (replaces impl plan §16)

Both registers stay conceptually distinct but render in glass. The register tints the glass and swaps fonts.

`styles/registers/builder-led.css`:

```css
.register-builder-led {
  --reg-glass-fill: rgba(255, 255, 255, 0.55);
  --reg-glass-edge: rgba(255, 255, 255, 0.45);
  --reg-accent: var(--accent);              /* cobalt */
  --reg-display: var(--font-bricolage);
  --reg-body: var(--font-geist);
  --reg-mono: var(--font-geist-mono);
  --reg-text-style: 'mono-mode';            /* used in card layouts */
}
```

`styles/registers/vision-led.css`:

```css
.register-vision-led {
  --reg-glass-fill: rgba(252, 245, 230, 0.55);   /* warm-cream tinted glass */
  --reg-glass-edge: rgba(255, 240, 210, 0.55);
  --reg-accent: #C9A14A;                         /* gold */
  --reg-display: var(--font-fraunces);
  --reg-body: var(--font-newsreader);
  --reg-mono: var(--font-geist-mono);
  --reg-text-style: 'editorial-mode';
}
```

**Key principle:** registers don't replace the global glass system — they tint it. A `.register-vision-led .glass` panel uses `--reg-glass-fill` as a layer on top of the global glass.

---

## Format CSS (replaces impl plan §15 styling sections)

Each format uses the glass system. Style guidance per format:

**Cards-grid** (`styles/formats/cards.css`):
- Each facet is a `.glass` panel in a CSS Grid (`repeat(auto-fit, minmax(280px, 1fr))`, gap 16px)
- Title in `var(--reg-display)`, content in `var(--reg-body)`
- Subtle inner highlight on hover: `box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.7)`

**Node-graph** (`styles/formats/nodes.css`):
- `react-force-graph-2d` with custom `nodeCanvasObject` that draws glass orbs
- Each node: white circle with 10px blur shadow + 1px outline in `--reg-accent`, label in `--reg-mono` floating below
- Edges: thin lines at 50% accent opacity, glow on hover
- Background: transparent (the atmosphere shows through)

For the canvas-based force graph, you can't use CSS backdrop-filter inside the canvas — use semi-opaque white circles with a gaussian-feeling stroke instead. It reads as glass against the colored atmosphere behind.

**Magazine** (`styles/formats/magazine.css`):
- Hero facet: full-width `.glass` panel, title in `var(--reg-display)` italic, drop cap on first letter
- Subsequent facets: two-column flow of glass panels overlapping slightly with `transform: translateY(-N px)` on every other one
- `column-rule: 1px solid var(--glass-edge-soft);` between columns
- The vision-led register variant uses the warm-cream tint and Fraunces serif — magazine + vision-led is the strongest combination aesthetically

**Timeline** (`styles/formats/timeline.css`):
- Vertical line down the left, 1px in `--reg-accent` at 30% opacity
- Each facet is a `.glass` panel offset right of the line, with a glass orb (12px circle with glow) anchored on the line
- Mono date/era label in `--reg-mono`, title in `--reg-display`, content in `--reg-body`

---

## Tell Claude Code

Suggested first prompt to Claude Code in your repo:

> Read `prd.md`, `implementation-plan.md`, `design-addendum.md`, and `workspace-glass.html` in this order. The HTML mock is the canonical visual reference — extract the design system from it and apply it consistently across the workspace and all public-view formats.
>
> Implementation-plan.md has the architecture, file structure, prompts, and Gemini integration code (use those as-is). Design-addendum.md supersedes any visual styling in the implementation plan — it's the glass system. PRD has the product spec.
>
> Start by scaffolding the Next.js project, installing dependencies, setting up `globals.css` with the glass tokens and the atmospheric backdrop, then build out Layer 1 + Layer 2 + Layer 3 first (the architecture spine). UI comes after the logic works end-to-end. Don't get stuck polishing visuals before the LLM calls return valid JSON.
>
> Use `gemini-2.5-pro` (Layer 2) and `gemini-2.5-flash` (Layer 3). API key from Google AI Studio is in `.env.local` — do NOT commit it. Verify `.env.local` is gitignored before any commit.
>
> Commit at each test checkpoint in the implementation plan (1:35, 1:50, 2:30, 2:45, 3:00, 3:15, 3:30, 3:45, 4:00). Run the dev server and manually test before committing.

That gives Claude Code the exact ordering: read all four → spine first → UI second → commit at gates.

---

## Things in the impl plan to ignore

- §1e font block — superseded by this addendum
- §15 CSS for individual formats — superseded
- §16 register CSS — superseded
- The mock `pitch-workspace-mock.html` if it's still referenced anywhere — replaced by `workspace-glass.html`

Everything else in the impl plan (architecture, prompts, schemas, API routes, types, storage, identity-stripping, layer logic) is unchanged and current.
