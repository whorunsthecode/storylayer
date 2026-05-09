# Storylayer · Pitch Workspace

> Generative UI Global Hackathon · Track 2 (Copilot That Ships)

A two-sided personal-story pitching tool where the agent generates a *unique page per viewer* across **four axes of variation**:

1. **Visual register** — relationship-driven (deterministic mapping)
2. **Narrative archetype** — storyteller-corpus-driven (LLM)
3. **Facets shown** — viewer-driven (rule-based filter)
4. **Output format** — storyteller-strength-driven (LLM categorisation + rule lookup)

Same link, different listener → different page.

## Five-layer architecture

| Layer | What | Where | Mechanism |
|---|---|---|---|
| **1** | Register selection | `lib/logic/pick-register.ts` | Hard-coded relationship → register |
| **2** | Archetype + outstanding-characteristic detection | `lib/gemini/shape-detector.ts` | `gemini-2.5-flash` w/ JSON schema |
| **3** | Facet + edge extraction | `lib/gemini/facet-extractor.ts` | `gemini-2.5-flash` w/ JSON schema |
| **4** | Viewer-driven facet filter | `lib/logic/filter-facets.ts` | Pure function, no LLM |
| **5** | Output format selection | `lib/logic/pick-format.ts` | Hard-coded outstanding → format |

Visual variation is **rule-based**. Content variation is **LLM-based**. Viewer personalisation is **rule-based filtering**. Predictable, debuggable, ethically defensible.

## Stereotype safeguards

Five rules baked in (see PRD §"Stereotype safeguards"):

1. **Identity stripped before any LLM call** — `lib/logic/strip-identity.ts` replaces names with "the Person" and neutralises pronouns.
2. **Every Gemini prompt instructs against demographic inference** — see `lib/gemini/shape-detector.ts` and `lib/gemini/facet-extractor.ts`.
3. **Visual register is relationship-driven, never identity-driven**.
4. **Archetypes describe corpora, not people**.
5. **No "people like you" / "for someone with your background"**.

Two storytellers with identical corpora pitching the same relationship to the same listener get IDENTICAL output.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19
- **LLM:** Gemini API (`@google/genai`) — `gemini-2.5-flash` for both LLM layers
- **Schema:** Zod 4 with `z.toJSONSchema()` → Gemini structured output
- **Graph rendering:** `react-force-graph-2d`
- **URL extraction:** `@mozilla/readability` + `jsdom`
- **State:** in-memory `Map<id, pitch>` (resets on server restart)
- **Styling:** glassmorphic design system (see `app/globals.css`, `styles/registers.css`, `styles/formats.css`)

**Protocols listed in submission:** Gemini, A2UI (agent-rendered UI structure).

## Built for v1

- 2 registers fully realised: **builder-led** (cobalt + Geist) and **vision-led** (warm cream + Fraunces)
- 4 formats fully realised: **cards-grid**, **node-graph**, **magazine**, **timeline**
- 8 other formats stubbed — Layer 5 falls back per `lib/logic/pick-format.ts`, and the agent rationale panel surfaces the original choice

## Setup

```bash
npm install
cp .env.local.example .env.local
# add your Google AI Studio key to .env.local
npm run dev
```

Open http://localhost:3000.

## Demo flow

1. Pick **Applicant → Startup** → click **Load demo data** → click **Generate pitch**
2. Edit a facet card inline · hit **↻** to regenerate one card
3. **Share** → copy link → open in new tab → pick 2-4 facets in the onboarding modal
4. Switch storyteller to **Founder → Investor** → regenerate → magazine layout in vision-led (Fraunces serif, warm cream, drop caps)

## Project structure

```
app/
├── layout.tsx              # Atmospheric backdrop + fonts
├── page.tsx                # Workspace (Workspace component)
├── p/[id]/page.tsx         # Public pitch view
└── api/
    ├── generate/           # Layers 1, 2, 3, 5 in one route
    ├── regenerate/         # Per-facet regenerate
    ├── share/              # POST → uuid → /p/:id
    ├── pitch/[id]/         # GET persisted pitch
    └── demo-data/          # Karmen's pre-loaded corpus
components/
├── workspace/Workspace.tsx
└── public-view/
    ├── PublicPitchView.tsx
    └── formats/
        ├── CardsGrid.tsx
        ├── NodeGraph.tsx
        ├── Magazine.tsx
        └── Timeline.tsx
lib/
├── logic/                  # Pure-function layers (1, 4, 5) + identity stripping
├── gemini/                 # Layer 2 + 3 LLM calls
├── schemas/                # Zod schemas for structured output
├── storage/                # In-memory pitch store
├── fetch/                  # URL fetch + Readability
└── types/pitch.ts          # Shared types
styles/
├── registers.css           # builder-led + vision-led tints
└── formats.css             # 4 format layouts
data/demo-corpus.json       # Demo data
docs/                       # PRD + implementation plan + design addendum + glass mock
```

## Transparency

What was pre-existing:

- The PRD, implementation plan, design addendum, and glass HTML mock (in `docs/`) were written before the build.
- `create-next-app` boilerplate.
- The demo data text content was written by Karmen.

What was built today:

- All Next.js code under `app/`, `components/`, `lib/`, `styles/`.
- Glass design system implementation (per the addendum and HTML mock).
- All five layer implementations, prompts, and Gemini wiring.
- All 4 format renderers (cards-grid, node-graph, magazine, timeline).
- Workspace UI + public view + share flow.

Submission video and final demo polish to follow.

---

🤖 Built with Claude Code · Gemini 2.5 · Next.js 16
