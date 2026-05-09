# Pitch Workspace — PRD v6

**Generative UI Global Hackathon · May 9 · Track 2 (Copilot That Ships)**

---

## One-liner

A two-sided personal-story pitching tool where the agent generates a *unique page per viewer* across **four axes of variation**: visual register (relationship), narrative archetype (storyteller's career shape), facets shown (viewer's interest), and **output format** (chosen by the agent based on the storyteller's most outstanding characteristic — cards, node graph, timeline, magazine spread, portfolio gallery, manifesto, dashboard, and more). Same link, different listener → different page.

## What's new in v6 vs v5

The output format axis is **agent-picked from the storyteller's strength**, not viewer-picked. The format library is wide — 12 candidates — and Layer 2 expands to output BOTH the narrative archetype AND the storyteller's *outstanding characteristic*, which Layer 5 maps deterministically to a format. Same data + different relationship can yield different format, because the foregrounded strength shifts based on who's reading.

The full register library from v3/v4 is restored (5 registers in concept, 2 built fully). v5 over-trimmed.

## Concept

**Two roles: storyteller and listener.** Storyteller drops their data sources (URLs + pasted text). Agent ingests, extracts facets and connections, identifies the outstanding characteristic in their story given who's reading, and prepares the pitch. Storyteller curates and shares a link. Listener arrives, picks 2–4 facets they care about, and sees a tailored render — facets they wanted, in the format that best showcases this storyteller's strength, in the visual register native to the relationship.

This matters because: not every investor cares about your origin story. Not every hiring manager wants a long narrative. The right pitch is one shaped by *what this specific listener cares about, rendered in the format that flatters this specific storyteller's strength*.

## Audience

- **Storyteller (primary user):** founder pitching investors; investor pitching founders; applicant pitching a startup; startup founder pitching candidates.
- **Listener (secondary user):** receives a link, picks 2–4 facets, sees a render tailored to the relationship, the storyteller's strength, and their own interest.

## Problem

Personal story is the central currency in startup hiring and founder ↔ investor matching, but every existing tool forces both sides through one fixed template. v0 outputs a generic portfolio site. CV tools spit text into bullet lists. Chatbots answer questions but can't render structured personalised UI.

Listeners have wildly different lenses (an investor focused on fundraising track record vs one focused on team-building). Storytellers have wildly different strengths (a builder's gallery shouldn't read like a thesis-driven manifesto). The right pitch is jointly shaped by both — and that requires generative UI, not static templates.

## Why this is hackathon-grade gen UI

Four axes of generative UI variation:

1. **Visual register** (relationship-driven, deterministic) — typography, color, layout density.
2. **Narrative archetype** (storyteller-corpus-driven, LLM) — how the content is framed.
3. **Facets shown** (viewer-driven, rule-based filter) — what content is rendered.
4. **Output format** (storyteller-strength-driven, LLM + rule lookup) — *what shape* the rendering takes (grid of cards, node graph, magazine spread, timeline, gallery, dashboard, manifesto, etc.).

Same link, different listener → wholly different page. **No chatbot can do this. No code generator can do this.** v0 outputs one static page. This generates uniquely per viewer at request time.

## Core flow

**Storyteller side (one-time setup):**
1. Open workspace → pick relationship context (e.g. "I'm an applicant pitching a startup").
2. Drop data sources: public URLs (server-side fetched) + pasted text blocks (LinkedIn About, recent posts, bios).
3. Agent processes the corpus:
    - Layer 2 detects archetype + outstanding-characteristic given the relationship.
    - Layer 3 extracts facets + edges (connections between facets).
4. Workspace renders the extracted facets as editable cards. Storyteller edits inline, regenerates per facet.
5. Click **Share** → unique URL `/p/:id`. Persisted: facets, edges, register, archetype, outstanding-characteristic, chosen format.

**Listener side (per visit):**
6. Open the link → onboarding modal: *"What do you want to know about [Storyteller]?"* — pick 2–4 facets from the populated list.
7. Submit → page renders selected facets in the agent-chosen format, in the relationship-appropriate visual register.
8. Live toggles at top of public view: facets can be added/removed, page re-renders without LLM round-trip.

The shareable link is the deliverable. Each visit can produce a different rendering depending on the listener's facet picks; the format and register are locked at share time.

## Architecture & logic (five layers)

The product separates **visual variation (rule-based)** from **content variation (LLM-based)** from **viewer personalisation (rule-based filtering)**. Predictable, debuggable, ethically defensible.

### Layer 1 — Register selection (deterministic)

Hard-coded mapping. Relationship context (from a dropdown) → register.

```js
function pickRegister({storytellerRole, listenerRole}) {
  return {
    'founder-to-investor':   'vision-led',
    'investor-to-founder':   'trust-led',
    'applicant-to-startup':  'builder-led',
    'startup-to-applicant':  'mission-led',
    'cofounder-to-cofounder':'chemistry-led',
  }[`${storytellerRole}-to-${listenerRole}`] ?? 'builder-led';
}
```

Same relationship → same register, every time. No LLM, no inference.

### Layer 2 — Narrative shape + outstanding-characteristic detection (LLM)

One `gemini-2.5-pro` call. Input: identity-stripped corpus + relationship context. Output: two labels.

**Archetype (closed list of 5):**

```
arc-of-pivots         → multi-disciplinary, story is the thread
deepening-conviction  → single domain, increasing depth and stakes
builder-streak        → shipped work compounds
operator-builder      → execution and scaling expertise
domain-translator     → bridges between fields
```

**Outstanding characteristic (closed list of 9):**

```
shipped-output            → lots of concrete shipped work
network-of-influence      → strong connections, collaborators, mentions
voice-and-writing         → distinctive written voice, articles, posts
structured-thinking       → frameworks, methodologies, system thinking
journey-and-pivots        → compelling arc with meaningful shifts
conviction-and-thesis     → strong contrarian views, clear stance
credentialed-track        → degrees, awards, named institutions
multidisciplinary-range   → breadth across distinct domains
quantified-impact         → numbers, metrics, scale, financial outcomes
```

Outstanding-characteristic is **relationship-aware**: same corpus, different relationship can yield a different outstanding-characteristic, because what's "outstanding" depends on who's reading. An investor reading a founder pitch may foreground `quantified-impact`; a startup hiring a candidate may foreground `shipped-output` from the same data.

Pre-processing strips name → "the Person", removes pronouns, drops photo metadata. Hard-coded for demo CV; regex pass in v2.

**Prompt template:** *"You are categorizing a redacted story corpus by narrative shape AND outstanding characteristic, given the audience reading it. Do NOT infer or reference demographic attributes. Output one archetype label and one outstanding-characteristic label, both from the closed lists provided. Decide based on stated work, projects, education, and writing only — and on what would matter most to the listed audience."*

### Layer 3 — Facet + edge extraction (LLM, structured)

`gemini-2.5-flash` with response schema. Input: `(stripped_corpus, relationship, register, archetype, outstanding-characteristic, facet_library)`. Output:

```json
{
  "facets": [
    {"id": "shipped-work",      "title": "...", "content": "..."},
    {"id": "range",             "title": "...", "content": "..."},
    {"id": "values",            "title": "...", "content": "..."},
    {"id": "formative-experience","title": "...", "content": "..."}
  ],
  "edges": [
    {"from": "values", "to": "shipped-work",    "label": "drives"},
    {"from": "shipped-work", "to": "range",     "label": "demonstrates"},
    {"from": "formative-experience", "to": "values", "label": "shaped"}
  ]
}
```

Edges are LLM-derived (specific to this storyteller's story), not generic. They're critical for the node-graph format — without them, nodes are just cards in a different layout.

**Facet library (universal, ~10):** values, formative-experience, origin, shipped-work, range, vision, fundraising-track, looking-for, how-i-work, outside-interests.

The LLM extracts each facet from the corpus. Empty facets (e.g., a recent grad has no fundraising-track) are dropped from the available list shown to the viewer.

### Layer 4 — Viewer-driven facet filtering (rule-based)

Listener picks facets at the public view onboarding. Page filters the persisted facet list to selected ones. No LLM call. Pre-extracted content is filtered and rendered.

This is critical: viewer changes don't trigger LLM calls. Page is fast, predictable, cheap.

### Layer 5 — Output format selection (rule-based, from outstanding-characteristic)

Hard-coded mapping. Outstanding-characteristic → format.

```js
function pickFormat({outstandingCharacteristic}) {
  return {
    'shipped-output':            'portfolio-gallery',
    'network-of-influence':      'node-graph',
    'voice-and-writing':         'magazine',
    'structured-thinking':       'process-diagram',
    'journey-and-pivots':        'timeline',
    'conviction-and-thesis':     'manifesto',
    'credentialed-track':        'annotated-cv',
    'multidisciplinary-range':   'map-constellation',
    'quantified-impact':         'data-dashboard',
  }[outstandingCharacteristic] ?? 'cards-grid';
}
```

Cards-grid is the default fallback. Same data + different relationship → potentially different format, because Layer 2's outstanding-characteristic shifts with audience.

## Format library (12 candidates)

| # | Format | Fires for | Look |
|---|---|---|---|
| 1 | **Cards grid** *(default)* | Balanced storytellers without one outsized strength | Clean grid, equal-weight facets |
| 2 | **Node graph (Obsidian)** | Interdisciplinary, cross-domain, network thinkers | Force-directed graph, facets as nodes, edges showing connections |
| 3 | **Timeline / arc** | Compelling journey, pivots, chronology | Horizontal or vertical timeline with milestones |
| 4 | **Magazine / editorial spread** | Strong written voice, narrative coherence, well-crafted prose | Pull quotes, body columns, drop caps, serif typography |
| 5 | **Portfolio gallery** | Builders, designers, creators where shipped work is the strength | Image-led tiles, large project thumbnails, work-first |
| 6 | **Data dashboard** | Quantified achievements (growth metrics, exits, fundraising) | Big stat numbers, KPI tiles, comparison visualisations |
| 7 | **Map / constellation** | Multidisciplinary range across domains | 2D map with regions for different domains, projects placed within them |
| 8 | **Manifesto / single-page declaration** | Strong-conviction, contrarian, thesis-led storytellers | Huge typography, one declarative statement, supporting evidence below |
| 9 | **Process / method diagram** | Methodology-led, framework-builders, system thinkers | Flowchart or systems diagram, step-by-step structure |
| 10 | **Conversation / Q&A** | Voice-strong, dialogue-driven, interview-style storytellers | Chat-bubble or interview-transcript layout |
| 11 | **Annotated CV with margin notes** | Heavy credentialed track (degrees, awards, named institutions) | Structured CV with side annotations giving context to each line |
| 12 | **Network of people** | Relationship-led, community-built, collaborative storytellers | Social graph of mentors, collaborators, co-creators |

**Build for v1:** 4 formats fully realised (recommend **cards-grid + node-graph + magazine + timeline** — maximally different aesthetically). Other 8 stubbed with "agent considered: [format]" placeholder card on public view, showing the agent's reasoning even when the format isn't built.

## Visual register library

Five registers in concept; two built fully for v1.

| Register | Relationship | Typography | Color | Layout | Build |
|---|---|---|---|---|---|
| **vision-led** | founder → investor | Fraunces (display) + Newsreader (body) | Warm cream, deep ink, gold accent | Big-claim layout, dramatic pull quotes, thesis-first | ✅ Full |
| **builder-led** | applicant → startup | Geist + Geist Mono | Near-white, vivid coral accent | Tight grid, mono timestamps, ship-log register | ✅ Full |
| trust-led | investor → founder | Inter or Söhne + serif numerals | White, deep navy accent | Track-record-led, restrained, table-of-contents feel | ⏸ Stub |
| mission-led | startup → applicant | Distinctive humanist sans | Saturated single color, bold | Mission-statement layout, who-we-are forward | ⏸ Stub |
| chemistry-led | cofounder ↔ cofounder | Hand-feel display + clean sans | Variable | Asymmetric, dialogic | ⏸ Stretch |

Two registers built fully (vision-led + builder-led — maximally different aesthetically). Stubbed registers show "agent considered: [register]" placeholder.

**Format × register orthogonality:** any format can render in any register. Register sets typography + colour + density. Format sets structural layout. They compose: e.g., builder-led + node-graph = white background, mono node labels, coral edges. Vision-led + magazine = serif pull quotes, warm cream, gold drop caps.

## Stereotype safeguards

Five rules baked in:

1. **Identity stripped before LLM input.** Name → "the Person". Photos never sent. Pronouns neutralised. Nationality lines kept only when factual education/work; otherwise removed.
2. **Explicit prompt instruction in every Gemini call:** *"Do NOT reference or infer the storyteller's gender, race, ethnicity, nationality, or age. Frame strictly based on stated work, projects, education, and writing."*
3. **Visual register is relationship-driven, never identity-driven.** Same relationship → same register, regardless of who the storyteller is.
4. **Career-shape archetypes and outstanding-characteristics describe corpora, not people.** "Multidisciplinary-range" describes a story's distribution of work. "Builder-streak" describes a corpus's project density. Never the person.
5. **Forbidden output patterns:** no "people like you", no "for someone with your background", no "as a [demographic]". Agent is the storyteller's TOOL, not their evaluator.

Two storytellers with identical corpora pitching the same relationship to the same listener get IDENTICAL output. That's the design.

## Data ingestion

Three input modes, aggregated into one corpus before LLM:

1. **Public URL fetch** — server-side fetch + readability extraction (portfolios, public blogs).
2. **Pasted text blocks** — labelled: "LinkedIn About", "Recent tweets", "Bio", etc. User adds as many as they want.
3. **Demo data button** — for live demo, Karmen's portfolio URL (karmenyip.netlify.app) + pre-loaded LinkedIn About + tweets, single click.

LinkedIn / Twitter scraping is not attempted (blocked at platform level). UI labels this honestly as "what's your story" rather than implying scraping.

## In scope (build in 4h)

- Relationship-context picker (5 options in dropdown, 2 fully wired through registers)
- Data-source ingestion: URL fetch + pasted text blocks
- Identity-stripping pre-processor
- Layer 1: register-selection function
- Layer 2: shape + outstanding-characteristic detection (Gemini 2.5-pro)
- Layer 3: facet + edge extraction (Gemini 2.5-flash with response schema)
- Layer 4: rule-based facet filter
- Layer 5: rule-based format selector from outstanding-characteristic
- **Two registers fully realised** — builder-led and vision-led
- **Four formats fully realised** — cards-grid, node-graph, magazine, timeline
- Eight other formats stubbed with "agent considered" placeholder showing the agent's reasoning
- Workspace at `/` — facet cards, inline edit + regenerate-per-facet
- Public view at `/p/:id` — viewer onboarding (facet picker) + format-aware render
- Live facet toggling at the top of public view
- In-memory persistence (`Map<id, pitch>` on Next.js server)
- Share button → uuid → public URL
- Demo data pre-load button

## Out of scope

- Mutual "pitch back" flow (cut from v3)
- Three additional registers (trust-led, mission-led, chemistry-led — stubbed only)
- Eight format builds (gallery, dashboard, map, manifesto, process, conversation, annotated-cv, network-of-people — stubbed only)
- LinkedIn / Twitter scraping
- Auth / accounts
- PDF / image export
- Mobile workspace
- Storyteller-added custom facets
- JD-based relationship inference
- Viewer override of agent-chosen format

## Tech stack

- **Frontend:** Next.js 14 (App Router) + CopilotKit (workspace facet cards, regenerate)
- **Graph rendering:** `react-force-graph-2d` (npm) for the node-graph format
- **LLM:** Gemini API — `gemini-2.5-pro` (Layer 2 shape + outstanding-characteristic), `gemini-2.5-flash` with response schema (Layer 3 facets + edges)
- **Backend:** Next.js API routes — `/api/ingest`, `/api/generate`, `/api/share`, `/api/pitch/:id`
- **Web fetch:** server-side fetch + readability extractor
- **State:** in-memory `Map<id, pitch>` — resets on server restart, fine for demo
- **Identity-stripping:** small JS module, hard-coded for demo CV

**Protocols listed in submission:** CopilotKit, A2UI (agent-rendered UI structure), Gemini.

## Demo narrative (2–3 min)

1. **(15s)** *"Personal story is the currency in startup hiring and founder-investor matching. Existing tools force every listener through one template. We built a tool where the agent picks four things at once: visual register from the relationship, narrative archetype from the storyteller's career, the format from their strongest characteristic, and the listener picks which facets they care about. Same link, different page every time."*
2. **(20s)** Open workspace → pick **applicant → startup** → click **Demo data**. Agent runs Layers 1–5: register = builder-led, archetype = arc-of-pivots, outstanding-characteristic = **multidisciplinary-range**, format chosen = **node-graph**. Workspace renders facets as editable cards. *"Karmen's strongest characteristic to a startup hiring manager is her range across journalism, design, governance research, and shipping — so the agent picked the node-graph format to show how those connect."*
3. **(15s)** Edit a card. Hit regenerate on **shipped-work**. Watch it update.
4. **(15s)** Click **Share** → copy link.
5. **(30s)** Open the link in a new tab as Listener A. Onboarding: pick **shipped-work + range + values + how-i-work**. Page renders as a force-directed graph in builder-led register — facets as nodes, LLM-derived edges showing *"values → drives → shipped-work"*. *"This is what a hiring founder sees."*
6. **(30s)** Same link, second tab as Listener B. Pick **formative-experience + origin + values**. Page re-renders with those nodes only. *"Same link. Same person. Different facets, different graph."*
7. **(30s)** Back to the workspace. Switch relationship to **founder → investor** with the SAME demo data. Layer 2 reruns: outstanding-characteristic now = **conviction-and-thesis** (because what's outstanding to an investor is different from what's outstanding to a hiring manager). Layer 5 picks **manifesto** format... actually for v1 demo, we ship **magazine** format here — Fraunces serif, warm cream, big-claim thesis-first layout. *"Same person. Same data. Completely different visual structure, because investors care about conviction, hiring managers care about range."*
8. **(15s)** *"Four axes: register, archetype, facets, format. Identity-stripped before any LLM call. Couldn't be v0. Couldn't be a chatbot. The page is built for the listener, in the moment they ask."*

## 4-hour build plan

| Time | What happens |
|---|---|
| **12:30–1:00** (during kickoff) | Repo + Next.js + CopilotKit boilerplate. Gemini key from check-in credits. `react-force-graph-2d` installed. Demo data prepped. Visual specs sketched (Geist + Fraunces fonts loaded). Facet library + edge schema + format library locked. |
| **1:00–1:30** | Stand-up. Role split. Card schemas + format schemas in JSON. Layer 5 mapping table written. |
| **1:30–3:30** (parallel, 2h) | **A — Storyteller workspace + share/persistence:** CopilotKit canvas with facet cards, edit + regenerate per facet, share button → uuid → `/p/:id`. **B — Logic + Gemini:** Layer 1 function. Layer 2 (shape + outstanding-characteristic in one call). Layer 3 (facets + edges with response schema). Layer 4 + Layer 5 functions. Identity-stripping. URL fetch + corpus aggregation. **C — Register CSS + format library + public view:** vision-led + builder-led CSS, both styled across 4 formats (cards-grid, node-graph, magazine, timeline). Viewer onboarding modal. Live facet toggling. Stub-format placeholders. |
| **3:30–4:00** | Integration. End-to-end on Karmen's data: applicant→startup AND founder→investor, with format-switching driven by Layer 5. Test viewer flow with two different facet selections. Test multiple format renderings. |
| **4:00–4:30** | Polish. Demo dry-run. Catch register-switch bugs and format-switch bugs. |
| **4:30–4:50** | Record 2–3 min demo video. |
| **4:50–5:00** | Final run-through. Lock one-sentence pitch. README transparency note (pre-existing vs built today). |
| **5:00–5:45** | Show & tell live demo. Non-demoer finalises README + uploads video. |
| **5:45–6:00** | Submit. |

## Risk & de-risk plan

- **Highest risk: 4 formats × 2 registers = 8 styled treatments.** Mitigation: C focuses on cards-grid + node-graph in both registers FIRST (the demo's two key reveals). Magazine and timeline in builder-led only. Skip vision-led versions of magazine/timeline if behind. The Karmen demo can use cards-grid for builder-led + node-graph for the multidisciplinary moment + magazine for vision-led. That's 3 styled treatments, not 8.
- **Second-highest risk: Layer 3 returning consistent facet+edge JSON.** Mitigation: B locks the prompt + tests against demo data first thing at 1:30, before A and C build dependent UI.
- **Third-highest risk: node graph styling per register in `react-force-graph-2d`.** Mitigation: B prototypes a basic working graph by 2:00 with Karmen's data; if flaky, fall back to a static SVG-rendered grid layout.
- **If Layer 3 is unreliable by 2:30:** drop edges, ship nodes as a non-connected grid layout. Still demos the format axis.

## Success criteria

- Live demo: same link rendered with different facet picks → visibly different content on screen
- Relationship-switch causes register + format re-render in **< 8 seconds** (different storyteller-strength → different format)
- Public view loads instantly, no editing chrome
- Live facet toggling on public view works without LLM round-trip
- Stereotype safeguards visible in the README (identity-stripping + prompt instructions)
- Pitch lands the four-axis story

## Open decisions before 1pm

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Which 4 formats to fully build | cards + nodes + magazine + timeline / cards + nodes + portfolio + timeline / cards + nodes + magazine + manifesto | **cards + nodes + magazine + timeline** — max aesthetic contrast (grid vs graph vs serif-spread vs chronological) |
| 2 | Format chooser for stubbed formats | "Agent considered: [format]" card with reasoning / drop entirely | **Show "agent considered" card** — it sells the gen-UI story even when the format isn't built |
| 3 | Facet extraction call shape | Single bulk call (all facets + edges together) / two calls (facets, then edges) | **Single bulk call** — fewer round-trips, faster |
| 4 | Layer 2 call shape | Single call (archetype + outstanding-characteristic together) / two calls | **Single call** — both fields in one structured response |
| 5 | Format chooser UX (workspace) | Show storyteller which format the agent picked / hidden / show + allow override | **Show + lock** — transparency without giving viewer override (preserves storyteller-strength purity) |
| 6 | Demo direction order | applicant→startup first / founder→investor first | **applicant→startup first** — most relatable opener; the format shift to magazine in the second half is the punch |
| 7 | Node library | `react-force-graph-2d` / d3-force / custom SVG | **`react-force-graph-2d`** — fastest |
| 8 | Edge data source | LLM-derived in Layer 3 / hard-coded relationships | **LLM-derived** — story-specific |
| 9 | Public-view URL pattern | `/p/:uuid` / `/pitch/:slug` | **`/p/:uuid`** — short, clean for sharing |

## One-sentence pitch (draft for submission)

*A pitch tool where the agent generates a unique page for every listener — across four axes: visual register chosen from the relationship, narrative archetype and outstanding characteristic detected from the storyteller's corpus, output format mapped from the strength (cards, node graph, timeline, magazine, gallery, dashboard, manifesto, more), and facets shown picked by the viewer. Same link, different listener, different page.*

## Team

To fill in: A / B / C names + repo URL.
