# Storylayer

> **Generative UI Global Hackathon · Track 2 (Copilot That Ships) · AI Tinkerers Hong Kong**
> Live: https://storylayer-five.vercel.app
> Team: Michael Tam (Joyventure.io) · Karmen Yip (HSBC)

A personal-story pitch tool where **the agent generates the page at view time, per listener, per intent**. Same link, different listener → different reasoning, different facets, different layout, different evidence. Not a chatbot. Not v0. The agent makes a multi-step decision visible in real time and renders structured UI as its answer.

---

## One-sentence pitch

> Storylayer turns a personal-story corpus into an agentic page that renders itself for each listener — agent assigns a component type per facet, picks weight/span/emphasis, then at view time runs a streaming pipeline that uses tools to ground its picks in actual corpus quotes before composing the page.

---

## The agentic claim, plainly

1. **Storyteller side (share time).** Drop corpus → agent makes four decisions (register, archetype, outstanding characteristic, composition) with reasoning per decision. Layer 3 assigns one of seven component types per facet plus weight/span/emphasis. Workspace surfaces the full agent rationale and manifest.

2. **Listener side (view time).** A streaming pipeline runs *per request*:
   - **Parses** the listener's intent in plain English
   - **Reasons** with autonomous tool calls to `find_evidence_in_corpus` — agent decides which facets to ground, what to search for
   - **Iterates** — drops facets without evidence, picks alternatives
   - **Commits** structured output: selected facets + evidence map + reasoning addressed to the listener
   - Page **renders** the agent's picks with evidence quotes pinned under each facet

3. **Visible the whole way.** A live thinking trace shows every step, every tool call, every relevance score. The listener watches the agent work.

4. **Depth on demand.** Every revealed facet has four pull buttons (Dig deeper · Show proof · What made this · Connect it). Each fires a focused LLM call that returns ONE new component (metric grid, node graph, timeline, chapter spread…) threaded under the originating facet. Multiple pulls stack independently.

5. **Hero-first reactive reveal.** Listener lands on the hero facet. Layers surface every 5s in weight order, or on tap. Same link, two listeners, two different pages from two different intents.

---

## Four protocols, honestly

| Protocol | How Storylayer uses it |
|---|---|
| **CopilotKit** | `<CopilotKit>` provider wraps the listener view; `useCopilotReadable` exposes the live pitch state (intent, picks, reveal, threads) to the runtime; `/api/copilotkit` Next.js route uses `GoogleGenerativeAIAdapter`. |
| **AG-UI** | The `/api/listener/pipeline` route streams Server-Sent Events with `{type: 'step' \| 'tool_call' \| 'tool_result' \| 'result' \| 'error'}` shape. `useIntentPipeline` consumes them. `<ThinkingTrace>` renders them live with markers, relevance badges, fade-in animations. |
| **A2UI** (agent → UI structure) | The agent emits structured component specs — per-facet `componentType` + structured data fields (metrics, events, nodes, connections, skills, quote) + evidence map. The frontend renders those specs into actual components. Not text injected into a fixed UI. |
| **MCP-shape** | Gemini function-calling with declared `find_evidence_in_corpus` tool. Agent decides on its own whether to invoke it, how to phrase the search, when it has enough evidence. Tool-use loop capped at 8 iterations. Pattern is MCP-compatible — registering with an MCP server transport is a wiring change, not an architectural one. |

---

## Architecture — six layers

| Layer | What | Where | Mechanism |
|---|---|---|---|
| **1** | Register selection | `lib/logic/pick-register.ts` | Hard-coded `relationship → register` |
| **2** | Archetype + outstanding-characteristic | `lib/gemini/shape-detector.ts` | Gemini, single JSON-schema call, two reasoning fields |
| **3** | Facet extraction + per-facet component + weight/span/emphasis | `lib/gemini/facet-extractor.ts` | Gemini, JSON-schema, one call returns the full manifest |
| **4** | Listener intent → facet selection (view time) | `/api/listener/pipeline` (primary) and `/api/listener/intent` (fallback) | Streaming SSE pipeline with tool-use OR single-call shortcut |
| **5** | Pull threads — depth on demand | `/api/pull` + `lib/gemini/pull-extractor.ts` | One Gemini call per gesture, returns one new component |
| **6** | Reactive reveal + thread state | `components/public-view/PublicPitchView.tsx` | Pure client logic, `useRef` dwell timer, `useState` thread map |

Visual variation (registers) is **deterministic**. Content variation (facets, components, evidence) is **agent-decided** with structured output. Listener personalisation happens **at view time, per request**.

---

## Stereotype safeguards

1. **Identity stripped before any LLM call** — `lib/logic/strip-identity.ts` replaces names with "the Person" and neutralises pronouns. The redacted corpus is what every LLM call sees.
2. **Every prompt instructs against demographic inference.** "Do NOT reference or infer gender, race, ethnicity, nationality, age." Repeated across `shape-detector`, `facet-extractor`, `pull-extractor`, `listener/intent`, `listener/pipeline`.
3. **Visual register is relationship-driven, never identity-driven.** Same relationship → same register, always.
4. **Archetypes and outstanding characteristics describe corpora, not people.** "Multidisciplinary-range" describes a story's distribution of work; "builder-streak" describes project density.
5. **No forbidden patterns.** No "people like you", no "for someone with your background", no "as a [demographic]".

Two storytellers with identical corpora pitching the same relationship to the same listener get IDENTICAL output. That's the design.

---

## Component library (7 types, agent-assigned per facet)

| Component | Use | Width |
|---|---|---|
| **node-graph** | Connected entities (multidisciplinary range, project networks) | full · dark Obsidian panel with glowing nodes + verb-phrase edges |
| **metric-grid** | Quantified impact, fundraising, scale | full or half · 72px hero number + satellite stats |
| **timeline-strip** | Chronological journey | full · horizontal line, glowing dots, year + title + content per event |
| **quote-manifesto** | Belief, conviction, values | full · 30px italic dominant quote with accent left border |
| **skill-constellation** | Weighted capabilities | half · pills sized 1/2/3 by weight |
| **chapter-spread** | Single coherent narrative passage | half · editorial italic title + 2-column body + drop cap |
| **facet-card** | Default fallback | half · plain glass card |

Each component renders in the active register's typography (Bricolage/Geist for builder-led, Fraunces/Newsreader for vision-led) and accent palette (cobalt or gold).

---

## Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **LLM:** Gemini 2.5 Flash Lite via `@google/genai` SDK
- **Schemas:** Zod 4 (`z.toJSONSchema`) for structured Gemini output
- **Tool use:** Gemini function calling with `FunctionCallingConfigMode.AUTO`
- **Streaming:** Server-Sent Events from Next.js route handlers
- **Graph rendering:** `react-force-graph-2d`
- **URL extraction:** Jina AI Reader (`r.jina.ai`) with raw-HTML fallback
- **Agent UI:** CopilotKit (`@copilotkit/react-core`, `@copilotkit/runtime`)
- **Storage:** in-memory `Map<id, pitch>` (Fluid Compute keeps instances warm across the demo session)
- **Hosting:** Vercel

---

## Live demo flow

1. Open https://storylayer-five.vercel.app
2. Pick **Applicant → Startup**
3. Click **↓ Load demo data** then **Generate pitch** (~6s)
4. Read the **Agent rationale** panel — 4 decisions with reasoning + sources
5. Scroll to the **Manifest** — each facet's component type + weight/span/emphasis badges
6. Click **Share →** — link is auto-copied
7. Open the link in a fresh tab. Type your intent (or click a suggestion):
   - *"I'm hiring an early PM and care about how fast they ship"*
8. Watch the **live thinking trace** — agent parses intent, calls the evidence tool, ranks relevance, commits picks
9. The page renders — hero-first, with **evidence quotes pinned under each facet**
10. Wait 5s for the next layer to surface, or hit **Show me more →**
11. Click any pull verb (**Dig deeper / Show proof / What made this / Connect it**) — a new agent-chosen component threads underneath
12. At the bottom, type a remix into the bar — the pipeline re-runs with your previous reasoning as context
13. Open the same link in **another tab** with a different intent: *"I'm an investor evaluating long-term conviction"* — completely different facets, different evidence, different reasoning

---

## Project structure

```
app/
├── layout.tsx                       # Atmospheric backdrop + fonts (Bricolage, Geist, Fraunces, Newsreader)
├── page.tsx                         # Workspace shell
├── p/[id]/page.tsx                  # Public listener view entrypoint
└── api/
    ├── generate/                    # Layers 1-3 (register → archetype → facets+components)
    ├── regenerate/                  # Per-facet regenerate with optional hint
    ├── share/                       # POST pitch → uuid → /p/:id
    ├── pitch/[id]/                  # GET persisted pitch
    ├── demo-data/                   # Pre-loaded corpus
    ├── copilotkit/                  # CopilotKit runtime endpoint (Gemini adapter)
    ├── pull/                        # Per-facet pull-thread gesture → one new component
    └── listener/
        ├── intent/                  # Fallback single-call view-time picker
        └── pipeline/                # SSE streaming multi-step pipeline with tool use

components/
├── workspace/
│   ├── Workspace.tsx                # Workspace UI (context picker, sources, manifest, share)
│   └── AgentRationale.tsx           # 4-decision rationale panel
└── public-view/
    ├── PublicPitchView.tsx          # Listener view (intent → pipeline → render)
    ├── IntentOnboarding.tsx         # Text-input + suggestions
    ├── ThinkingTrace.tsx            # Live AG-UI event stream renderer
    ├── ListenerRationale.tsx        # "agent rendered this for you" panel
    ├── PullActions.tsx              # 4-verb pull buttons
    ├── RemixBar.tsx                 # Multi-turn remix input
    └── components/                  # 7 facet renderers
        ├── FacetCard.tsx
        ├── ChapterSpread.tsx
        ├── QuoteManifesto.tsx
        ├── MetricGrid.tsx
        ├── TimelineStrip.tsx
        ├── SkillConstellation.tsx
        └── NodeGraphFacet.tsx

lib/
├── logic/
│   ├── pick-register.ts             # Layer 1 — relationship → register
│   ├── strip-identity.ts            # Name + pronoun redaction before any LLM call
│   └── decision-reasons.ts          # Deterministic reason lookups for register + composition
├── gemini/
│   ├── client.ts                    # GoogleGenAI singleton
│   ├── shape-detector.ts            # Layer 2
│   ├── facet-extractor.ts           # Layer 3
│   └── pull-extractor.ts            # Layer 5 (pull threads)
├── schemas/
│   ├── shape.ts                     # Layer 2 zod schema
│   ├── extraction.ts                # Layer 3 zod schema (facet + component + structured data)
│   ├── intent.ts                    # Listener intent zod schema
│   └── pull.ts                      # Pull-thread zod schema + action intents
├── tools/
│   └── find-evidence.ts             # MCP-shape evidence-search tool
├── hooks/
│   └── useIntentPipeline.ts         # SSE consumer hook for the pipeline
├── fetch/
│   └── url-fetcher.ts               # Jina AI Reader + raw fallback
├── storage/
│   └── memory-store.ts              # global.__pitchStore Map<id, pitch>
├── labels.ts                        # Display labels for enums
└── types/pitch.ts                   # Shared types

styles/
├── registers.css                    # builder-led + vision-led tints
└── components.css                   # All 7 component treatments + listener UI

data/
└── demo-corpus.json                 # Karmen's pre-loaded demo data
```

---

## Setup

```bash
git clone https://github.com/whorunsthecode/storylayer
cd storylayer
npm install
cp .env.local.example .env.local
# Add your Google AI Studio API key (https://aistudio.google.com/apikey) to .env.local
npm run dev
```

Open http://localhost:3000.

---

## Transparency note

### What was pre-existing before the build day

- **PRD v6** (`docs/pitch-workspace-prd.md`), implementation plan (`docs/implementation-plan.md`), design addendum (`docs/design-addendum.md`), and the glassmorphic HTML mock (`docs/workspace-glass.html`) — written by Karmen as the product spec.
- **Michael's checkpoint document** outlining the listener-first architecture: reactive reveal, pull threads, component-per-facet, layout composition (weight/span/emphasis). Provided mid-build as a directional patch.
- **Subsequent patch documents** drafted by Michael during the build introducing the intent endpoint and the streaming multi-step pipeline with tool use.
- The `create-next-app` boilerplate scaffold.
- Demo data text content (LinkedIn About, work history, posts, origin, how-i-work) written by Karmen.

### What was built today

- **All application code** under `app/`, `components/`, `lib/`, `styles/`, and `data/`. Every TypeScript and CSS file.
- **The five-layer architecture spine** — register selection, identity stripping, archetype + characteristic detection, facet + component extraction, format-by-fallback then component-per-facet refactor.
- **The listener-side gen-UI flow** — intent input, streaming SSE pipeline with autonomous tool use, live thinking trace, evidence quotes, hero-first reactive reveal, four-verb pull threads, multi-turn remix.
- **The 7 facet component renderers** — FacetCard / ChapterSpread / QuoteManifesto / MetricGrid / TimelineStrip / SkillConstellation / NodeGraphFacet — plus their boosted visual treatments per the design spec.
- **CopilotKit integration** — provider, runtime endpoint, useCopilotReadable exposing pitch state.
- **Identity-stripping module** — name redaction + pronoun neutralisation before any LLM call.
- **Stereotype safeguards** in every Gemini prompt.
- **Vercel deployment** with env vars configured.

### Tools used during the build

- **Claude Code** as the pair-programming assistant — wrote the bulk of TypeScript/CSS from PRD + checkpoint specs and Karmen's direct guidance, ran iterative smoke tests, kept the architecture coherent across the live pivots (one-format-per-page → component-per-facet → listener-intent-driven → streaming pipeline with tools).
- **Gemini 2.5 Flash Lite** as the runtime LLM for all layers — paid tier on the linked GCP billing account.

---

## Known constraints

- **In-memory store.** Pitches live in a `global.__pitchStore` Map. Single demo session works because Vercel's Fluid Compute reuses warm instances; cold instances will 404 on the listener URL. Production fix: swap to Vercel Blob or Edge Config (~10 minutes).
- **LinkedIn / X / social URLs are blocked at the platform level.** The UI now short-circuits with a clear "paste as text instead" message.
- **Portfolio URL fetching uses Jina AI Reader** as a public JS-rendering proxy. Fast for most sites; SPAs with long loading animations (e.g. typewriter intros) may return sparse content — the workspace surfaces a friendly error in that case.
- **20-request-per-day cap on `gemini-2.5-flash`** on free tier projects; we use `gemini-2.5-flash-lite` which is on the paid tier of the linked billing account. The README assumes the live demo URL is hit with a properly-billed key.

---

## Repo + submission

- Repo: https://github.com/whorunsthecode/storylayer (currently private — flip with `gh repo edit whorunsthecode/storylayer --visibility public` before submission)
- Live: https://storylayer-five.vercel.app
- Latest deploy: see `vercel ls`
- Submission protocols: **CopilotKit, AG-UI, A2UI, MCP (pattern)**

---

🤖 Built with Claude Code · Gemini 2.5 Flash Lite · Next.js 16 · Vercel
