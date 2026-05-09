# Pitch Workspace — Implementation Plan

**Companion to PRD v6 · 4-hour build · May 9 hackathon**

---

## How to use this doc

The PRD says *what*. This says *how*. Layered to match the PRD's five-layer architecture; structured to match the H1:30–H3:30 parallel split (A/B/C). Each member should be able to start their slice without reading the others.

---

## 1. Pre-build setup (12:30–1:00, during kickoff)

### 1a. Repo + boilerplate

```bash
npx create-next-app@latest pitch-workspace --typescript --tailwind --app --no-src-dir
cd pitch-workspace
npm install @google/genai zod zod-to-json-schema
npm install @copilotkit/react-core @copilotkit/react-ui
npm install react-force-graph-2d
npm install @mozilla/readability jsdom
```

Push to GitHub immediately, set repo public. Submission needs a public link.

### 1b. Google AI Studio API key

1. Go to https://aistudio.google.com/apikey while signed into the Google account that has the hackathon credits.
2. Create a key. Copy.
3. Add to `.env.local`:

```env
GOOGLE_API_KEY=AIza...
```

4. Add `.env.local` to `.gitignore` (Next.js does this by default — verify).

### 1c. Models we'll use

- **Layer 2** (shape + outstanding-characteristic detection): `gemini-2.5-pro` — stable, deeper reasoning needed for the relationship-aware judgement.
- **Layer 3** (facet + edge extraction): `gemini-2.5-flash` — stable, fast, good with structured output.

If `gemini-3-flash-preview` is faster on the day, swap the Layer 3 model — but only after the stable version works end-to-end. No model-swapping during integration.

### 1d. Demo data

Create `/data/demo-corpus.json` with Karmen's pre-loaded data:

```json
{
  "label": "Karmen Yip · demo",
  "sources": [
    {
      "type": "url",
      "label": "Personal portfolio",
      "url": "https://karmenyip.netlify.app"
    },
    {
      "type": "text",
      "label": "LinkedIn About",
      "content": "<paste Karmen's LinkedIn About here>"
    },
    {
      "type": "text",
      "label": "Recent tweets",
      "content": "<paste 3-5 representative tweets here>"
    },
    {
      "type": "text",
      "label": "Bio",
      "content": "<paste a short bio paragraph>"
    }
  ]
}
```

Karmen fills the actual content before 1pm. Don't leave this as a TODO.

### 1e. Fonts

Add to `/app/layout.tsx`:

```tsx
import { Geist, Geist_Mono, Fraunces, Newsreader } from 'next/font/google';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', style: ['normal','italic'] });
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader' });
```

---

## 2. Project structure

```
pitch-workspace/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Workspace (storyteller)
│   ├── p/[id]/page.tsx               # Public view (listener)
│   └── api/
│       ├── ingest/route.ts           # URL fetch + corpus aggregation
│       ├── generate/route.ts         # Layers 2 + 3 (Gemini calls)
│       ├── share/route.ts            # POST: persist pitch, return uuid
│       └── pitch/[id]/route.ts       # GET: retrieve persisted pitch
├── lib/
│   ├── gemini/
│   │   ├── client.ts                 # GoogleGenAI singleton
│   │   ├── shape-detector.ts         # Layer 2
│   │   └── facet-extractor.ts        # Layer 3
│   ├── logic/
│   │   ├── pick-register.ts          # Layer 1
│   │   ├── pick-format.ts            # Layer 5
│   │   ├── filter-facets.ts          # Layer 4
│   │   └── strip-identity.ts         # Pre-processor
│   ├── storage/
│   │   └── memory-store.ts           # global.pitchStore Map
│   ├── fetch/
│   │   └── url-fetcher.ts            # Server-side fetch + readability
│   ├── schemas/
│   │   ├── shape.ts                  # Zod for Layer 2 output
│   │   └── extraction.ts             # Zod for Layer 3 output
│   └── types/
│       └── pitch.ts                  # TypeScript types
├── components/
│   ├── workspace/
│   │   ├── RelationshipPicker.tsx
│   │   ├── DataSourceInput.tsx
│   │   ├── FacetCard.tsx             # CopilotKit-aware editable
│   │   └── ShareButton.tsx
│   ├── public-view/
│   │   ├── ViewerOnboarding.tsx      # Modal facet picker
│   │   ├── FacetToggleBar.tsx        # Live add/remove facets
│   │   └── formats/
│   │       ├── CardsGrid.tsx
│   │       ├── NodeGraph.tsx
│   │       ├── Magazine.tsx
│   │       ├── Timeline.tsx
│   │       └── StubFormat.tsx
│   └── shared/
│       └── RegisterWrapper.tsx       # Applies register CSS classes
├── styles/
│   ├── globals.css
│   ├── registers/
│   │   ├── builder-led.css
│   │   └── vision-led.css
│   └── formats/
│       ├── cards.css
│       ├── nodes.css
│       ├── magazine.css
│       └── timeline.css
└── data/
    └── demo-corpus.json
```

---

## 3. Core types

`lib/types/pitch.ts`:

```typescript
export type StorytellerRole = 'founder' | 'investor' | 'applicant' | 'startup' | 'cofounder';
export type ListenerRole = 'investor' | 'founder' | 'startup' | 'applicant' | 'cofounder';
export type WorkMode = 'fulltime' | 'parttime' | 'hybrid' | 'remote';
export type Register = 'vision-led' | 'trust-led' | 'builder-led' | 'mission-led' | 'chemistry-led';
export type Archetype = 'arc-of-pivots' | 'deepening-conviction' | 'builder-streak' | 'operator-builder' | 'domain-translator';
export type OutstandingCharacteristic =
  | 'shipped-output' | 'network-of-influence' | 'voice-and-writing'
  | 'structured-thinking' | 'journey-and-pivots' | 'conviction-and-thesis'
  | 'credentialed-track' | 'multidisciplinary-range' | 'quantified-impact';
export type Format =
  | 'cards-grid' | 'node-graph' | 'magazine' | 'timeline'
  | 'portfolio-gallery' | 'data-dashboard' | 'map-constellation'
  | 'manifesto' | 'process-diagram' | 'conversation' | 'annotated-cv' | 'network-of-people';

export type FacetId =
  | 'values' | 'formative-experience' | 'origin' | 'shipped-work'
  | 'range' | 'vision' | 'fundraising-track' | 'looking-for'
  | 'how-i-work' | 'outside-interests';

export interface Facet {
  id: FacetId;
  title: string;
  content: string;
}

export interface Edge {
  from: FacetId;
  to: FacetId;
  label: string;
}

export interface DataSource {
  type: 'url' | 'text';
  label: string;
  url?: string;
  content?: string;
}

export interface Pitch {
  id: string;
  storytellerRole: StorytellerRole;
  listenerRole: ListenerRole;
  register: Register;
  archetype: Archetype;
  outstandingCharacteristic: OutstandingCharacteristic;
  format: Format;
  facets: Facet[];
  edges: Edge[];
  createdAt: string;
}
```

---

## 4. Layer 1 — Register selection (deterministic)

`lib/logic/pick-register.ts`:

```typescript
import { Register, StorytellerRole, ListenerRole } from '@/lib/types/pitch';

export function pickRegister(s: StorytellerRole, l: ListenerRole): Register {
  const map: Record<string, Register> = {
    'founder-investor':   'vision-led',
    'investor-founder':   'trust-led',
    'applicant-startup':  'builder-led',
    'startup-applicant':  'mission-led',
    'cofounder-cofounder':'chemistry-led',
  };
  return map[`${s}-${l}`] ?? 'builder-led';
}
```

That's it. No Gemini call. Test it works before wiring anything else.

---

## 5. Layer 2 — Shape + outstanding-characteristic detection

### 5a. Zod schema

`lib/schemas/shape.ts`:

```typescript
import { z } from 'zod';

export const ShapeAndCharacteristicSchema = z.object({
  archetype: z.enum([
    'arc-of-pivots','deepening-conviction','builder-streak',
    'operator-builder','domain-translator'
  ]),
  outstandingCharacteristic: z.enum([
    'shipped-output','network-of-influence','voice-and-writing',
    'structured-thinking','journey-and-pivots','conviction-and-thesis',
    'credentialed-track','multidisciplinary-range','quantified-impact'
  ]),
  reasoning: z.string().describe('one-sentence rationale, for the agent-rationale UI panel')
});

export type ShapeAndCharacteristic = z.infer<typeof ShapeAndCharacteristicSchema>;
```

### 5b. Prompt template

`lib/gemini/shape-detector.ts`:

```typescript
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ShapeAndCharacteristicSchema, ShapeAndCharacteristic } from '@/lib/schemas/shape';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

const PROMPT = ({ corpus, storytellerRole, listenerRole }: {
  corpus: string; storytellerRole: string; listenerRole: string;
}) => `
You are categorizing a redacted personal-story corpus by:
(a) narrative archetype (the shape of the career story)
(b) outstanding characteristic (what's most distinctive about this person, given who's reading)

CRITICAL CONSTRAINTS:
- Do NOT reference or infer demographic attributes (gender, race, ethnicity, nationality, age).
- Do NOT use forbidden patterns: "people like you", "for someone with your background", "as a [demographic]".
- Decide based ONLY on stated work, projects, education, and writing.
- The corpus is redacted: name → "the Person", pronouns neutralised.

CONTEXT:
- Storyteller pitches as: ${storytellerRole}
- Listener reads as: ${listenerRole}

CORPUS:
${corpus}

Output JSON matching the provided schema. For "outstandingCharacteristic", choose what would matter MOST to the listener role given their context. The same corpus may have a different outstanding characteristic for different listeners — that is intentional. The "reasoning" field should be one short sentence explaining why this archetype + outstanding-characteristic was chosen, written in second person addressing the storyteller.
`;

export async function detectShape(args: {
  corpus: string; storytellerRole: string; listenerRole: string;
}): Promise<ShapeAndCharacteristic> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: PROMPT(args),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: zodToJsonSchema(ShapeAndCharacteristicSchema),
      temperature: 0.4,
    }
  });
  const parsed = JSON.parse(response.text);
  return ShapeAndCharacteristicSchema.parse(parsed);
}
```

### 5c. Smoke test (B should run this at 1:30 before anything else)

```typescript
// scratch/test-shape.ts — throwaway
import { detectShape } from '@/lib/gemini/shape-detector';
import demoCorpus from '@/data/demo-corpus.json';
import { stripIdentity } from '@/lib/logic/strip-identity';

const corpus = stripIdentity(demoCorpus.sources.map(s => s.content || s.url).join('\n\n'));
const result = await detectShape({
  corpus,
  storytellerRole: 'applicant',
  listenerRole: 'startup'
});
console.log(result);
// expected: archetype likely 'arc-of-pivots', outstandingCharacteristic likely 'multidisciplinary-range' or 'shipped-output'
```

If the call fails or returns garbage at 1:35, fix the prompt before A and C are deeply committed.

---

## 6. Layer 3 — Facet + edge extraction

### 6a. Zod schema

`lib/schemas/extraction.ts`:

```typescript
import { z } from 'zod';

const FacetIdEnum = z.enum([
  'values','formative-experience','origin','shipped-work',
  'range','vision','fundraising-track','looking-for',
  'how-i-work','outside-interests'
]);

export const FacetSchema = z.object({
  id: FacetIdEnum,
  title: z.string(),
  content: z.string()
});

export const EdgeSchema = z.object({
  from: FacetIdEnum,
  to: FacetIdEnum,
  label: z.string()
});

export const ExtractionSchema = z.object({
  facets: z.array(FacetSchema),
  edges: z.array(EdgeSchema)
});

export type Extraction = z.infer<typeof ExtractionSchema>;
```

### 6b. Prompt template

`lib/gemini/facet-extractor.ts`:

```typescript
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ExtractionSchema, Extraction } from '@/lib/schemas/extraction';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

const PROMPT = ({
  corpus, storytellerRole, listenerRole, register, archetype, outstandingCharacteristic
}: {
  corpus: string; storytellerRole: string; listenerRole: string;
  register: string; archetype: string; outstandingCharacteristic: string;
}) => `
You are extracting a structured pitch from a redacted personal-story corpus.

CRITICAL CONSTRAINTS:
- Do NOT reference or infer demographic attributes.
- Do NOT use forbidden patterns ("people like you", etc.).
- Decide based ONLY on stated work, projects, education, and writing.
- The corpus is redacted: name → "the Person", pronouns neutralised.

CONTEXT:
- Storyteller pitches as: ${storytellerRole}
- Listener reads as: ${listenerRole}
- Visual register (tone): ${register}
- Narrative archetype: ${archetype}
- Outstanding characteristic: ${outstandingCharacteristic}

CORPUS:
${corpus}

Extract these facets — only if the corpus contains material to populate them. If a facet has no support in the corpus, OMIT it entirely (do not include with empty content):

- values: core principles they hold non-negotiable
- formative-experience: the thing that changed their trajectory
- origin: how they came to do this work
- shipped-work: projects, products, output
- range: breadth across domains
- vision: thesis, what they think is true
- fundraising-track: past raises, runway, capital decisions
- looking-for: what they want next
- how-i-work: working style, team dynamics
- outside-interests: who they are when not working

For each facet:
- "title" should be a short evocative label (2-5 words), tuned to the visual register and listener role.
- "content" should be 2-4 sentences, written in voice appropriate to the register, addressed to the listener.

Then identify edges — connections between facets that are SPECIFIC to this person (not generic). Each edge has from, to, and a short label describing the relationship (e.g., "drives", "shaped", "demonstrates"). Aim for 3-6 edges total.

Output JSON matching the provided schema.
`;

export async function extractPitch(args: {
  corpus: string; storytellerRole: string; listenerRole: string;
  register: string; archetype: string; outstandingCharacteristic: string;
}): Promise<Extraction> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: PROMPT(args),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: zodToJsonSchema(ExtractionSchema),
      temperature: 0.6,
    }
  });
  const parsed = JSON.parse(response.text);
  return ExtractionSchema.parse(parsed);
}
```

---

## 7. Layer 4 — Viewer-driven facet filter

`lib/logic/filter-facets.ts`:

```typescript
import { Facet, FacetId, Edge } from '@/lib/types/pitch';

export function filterByViewer(
  facets: Facet[],
  edges: Edge[],
  selected: FacetId[]
): { facets: Facet[]; edges: Edge[] } {
  const selectedSet = new Set(selected);
  return {
    facets: facets.filter(f => selectedSet.has(f.id)),
    edges: edges.filter(e => selectedSet.has(e.from) && selectedSet.has(e.to))
  };
}
```

That's the entire layer. Pure function. Test in isolation.

---

## 8. Layer 5 — Format selection

`lib/logic/pick-format.ts`:

```typescript
import { Format, OutstandingCharacteristic } from '@/lib/types/pitch';

const BUILT_FORMATS: Format[] = ['cards-grid','node-graph','magazine','timeline'];

export function pickFormat(oc: OutstandingCharacteristic): Format {
  const map: Record<OutstandingCharacteristic, Format> = {
    'shipped-output':           'portfolio-gallery',
    'network-of-influence':     'node-graph',
    'voice-and-writing':        'magazine',
    'structured-thinking':      'process-diagram',
    'journey-and-pivots':       'timeline',
    'conviction-and-thesis':    'manifesto',
    'credentialed-track':       'annotated-cv',
    'multidisciplinary-range':  'map-constellation',
    'quantified-impact':        'data-dashboard',
  };
  const ideal = map[oc];
  if (BUILT_FORMATS.includes(ideal)) return ideal;
  // Fallback rules for stubs:
  if (ideal === 'manifesto' || ideal === 'annotated-cv') return 'magazine';
  if (ideal === 'portfolio-gallery' || ideal === 'data-dashboard') return 'cards-grid';
  if (ideal === 'map-constellation') return 'node-graph';
  if (ideal === 'process-diagram') return 'cards-grid';
  return 'cards-grid';
}

export function getStubReason(oc: OutstandingCharacteristic): { ideal: Format; fallback: Format } | null {
  const ideal = pickFormatIdeal(oc);
  const fallback = pickFormat(oc);
  return ideal !== fallback ? { ideal, fallback } : null;
}

function pickFormatIdeal(oc: OutstandingCharacteristic): Format {
  return {
    'shipped-output':           'portfolio-gallery',
    'network-of-influence':     'node-graph',
    'voice-and-writing':        'magazine',
    'structured-thinking':      'process-diagram',
    'journey-and-pivots':       'timeline',
    'conviction-and-thesis':    'manifesto',
    'credentialed-track':       'annotated-cv',
    'multidisciplinary-range':  'map-constellation',
    'quantified-impact':        'data-dashboard',
  }[oc];
}
```

`getStubReason` powers the "Agent considered: [ideal format] · falling back to [fallback]" placeholder UI.

---

## 9. Identity stripping

`lib/logic/strip-identity.ts`:

```typescript
const PRONOUN_MAP: Record<string, string> = {
  'he': 'they', 'him': 'them', 'his': 'their', 'himself': 'themself',
  'she': 'they', 'her': 'their', 'hers': 'theirs', 'herself': 'themself',
  'He': 'They', 'Him': 'Them', 'His': 'Their',
  'She': 'They', 'Her': 'Their',
};

const NAME_PLACEHOLDER = 'the Person';

export function stripIdentity(corpus: string, knownName?: string): string {
  let stripped = corpus;
  if (knownName) {
    const re = new RegExp(`\\b${escapeRegex(knownName)}\\b`, 'gi');
    stripped = stripped.replace(re, NAME_PLACEHOLDER);
  }
  for (const [from, to] of Object.entries(PRONOUN_MAP)) {
    stripped = stripped.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  }
  return stripped;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

For demo, hard-code `knownName = 'Karmen'`. v2 would do NER-based detection.

---

## 10. URL fetching

`lib/fetch/url-fetcher.ts`:

```typescript
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export async function fetchAndExtract(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 PitchWorkspace/0.1' }
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent ?? '';
}
```

---

## 11. Storage

`lib/storage/memory-store.ts`:

```typescript
import { Pitch } from '@/lib/types/pitch';

declare global {
  // eslint-disable-next-line no-var
  var __pitchStore: Map<string, Pitch> | undefined;
}

const store = global.__pitchStore ?? new Map<string, Pitch>();
if (process.env.NODE_ENV !== 'production') global.__pitchStore = store;

export function savePitch(p: Pitch): void { store.set(p.id, p); }
export function getPitch(id: string): Pitch | undefined { return store.get(id); }
```

The `global` trick survives Next.js dev-mode hot reload. Pitches will reset when the server restarts — that's fine for the demo.

---

## 12. API routes

### `/app/api/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripIdentity } from '@/lib/logic/strip-identity';
import { pickRegister } from '@/lib/logic/pick-register';
import { detectShape } from '@/lib/gemini/shape-detector';
import { extractPitch } from '@/lib/gemini/facet-extractor';
import { pickFormat } from '@/lib/logic/pick-format';
import { fetchAndExtract } from '@/lib/fetch/url-fetcher';

export async function POST(req: NextRequest) {
  const { sources, storytellerRole, listenerRole, knownName } = await req.json();

  // Aggregate corpus
  const parts: string[] = [];
  for (const s of sources) {
    if (s.type === 'url') {
      try { parts.push(`### ${s.label}\n${await fetchAndExtract(s.url)}`); }
      catch { /* skip failed fetches */ }
    } else {
      parts.push(`### ${s.label}\n${s.content}`);
    }
  }
  const rawCorpus = parts.join('\n\n');
  const corpus = stripIdentity(rawCorpus, knownName);

  // Layer 1
  const register = pickRegister(storytellerRole, listenerRole);

  // Layer 2
  const { archetype, outstandingCharacteristic, reasoning } = await detectShape({
    corpus, storytellerRole, listenerRole
  });

  // Layer 3
  const { facets, edges } = await extractPitch({
    corpus, storytellerRole, listenerRole, register, archetype, outstandingCharacteristic
  });

  // Layer 5
  const format = pickFormat(outstandingCharacteristic);

  return NextResponse.json({
    register, archetype, outstandingCharacteristic, reasoning,
    format, facets, edges
  });
}
```

### `/app/api/share/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { savePitch } from '@/lib/storage/memory-store';
import { Pitch } from '@/lib/types/pitch';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = randomUUID().slice(0, 8);
  const pitch: Pitch = { ...body, id, createdAt: new Date().toISOString() };
  savePitch(pitch);
  return NextResponse.json({ id, url: `/p/${id}` });
}
```

### `/app/api/pitch/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getPitch } from '@/lib/storage/memory-store';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const pitch = getPitch(params.id);
  if (!pitch) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(pitch);
}
```

---

## 13. Component-by-component (A's slice)

### `app/page.tsx` — workspace shell

State:
- `storytellerRole`, `listenerRole` (from `RelationshipPicker`)
- `sources: DataSource[]` (from `DataSourceInput`)
- `result` (after generate): `{register, archetype, outstandingCharacteristic, reasoning, format, facets, edges}`
- `editedFacets: Facet[]` (locally edited copy)
- `shareUrl: string | null`

Flow:
1. User picks roles → enables generate button.
2. User adds sources or clicks "Demo data".
3. Click "Generate" → POST `/api/generate` → set `result`.
4. Cards render in `register + format` (workspace always shows cards-grid for editing, even if Layer 5 picked another format — that's the editing surface).
5. User edits cards inline (CopilotKit) or clicks regenerate-per-facet.
6. Click "Share" → POST `/api/share` → set `shareUrl`.

### `components/workspace/FacetCard.tsx`

Uses `useCopilotAction` to expose a `regenerateFacet` action that the user can invoke per card. Inline-editable text via `contentEditable` or `textarea`. Two icon buttons: edit, regenerate.

Pseudo:

```tsx
'use client';
import { useCopilotAction } from '@copilotkit/react-core';
import { Facet } from '@/lib/types/pitch';

export function FacetCard({ facet, onChange, onRegenerate }: {
  facet: Facet; onChange: (f: Facet) => void; onRegenerate: () => Promise<void>;
}) {
  useCopilotAction({
    name: `regenerate_${facet.id}`,
    description: `Regenerate the ${facet.title} card`,
    handler: onRegenerate,
  });

  return (
    <div className="facet-card">
      <input
        value={facet.title}
        onChange={e => onChange({...facet, title: e.target.value})}
        className="facet-title"
      />
      <textarea
        value={facet.content}
        onChange={e => onChange({...facet, content: e.target.value})}
        className="facet-content"
      />
      <div className="facet-actions">
        <button onClick={onRegenerate}>↻</button>
      </div>
    </div>
  );
}
```

Per-facet regenerate is its own `/api/regenerate` route (small): re-runs Layer 3 with a `focusFacet` param so the LLM only rewrites that facet.

---

## 14. Public view (C's slice)

### `app/p/[id]/page.tsx`

Server component: fetches pitch by id from `/api/pitch/[id]`. Passes to a client `PublicPitchView` that handles the onboarding modal + format render.

```tsx
import { PublicPitchView } from '@/components/public-view/PublicPitchView';

export default async function Page({ params }: { params: { id: string }}) {
  const res = await fetch(`http://localhost:3000/api/pitch/${params.id}`, { cache: 'no-store' });
  const pitch = await res.json();
  return <PublicPitchView pitch={pitch} />;
}
```

### `components/public-view/PublicPitchView.tsx`

```tsx
'use client';
import { useState } from 'react';
import { ViewerOnboarding } from './ViewerOnboarding';
import { FacetToggleBar } from './FacetToggleBar';
import { CardsGrid } from './formats/CardsGrid';
import { NodeGraph } from './formats/NodeGraph';
import { Magazine } from './formats/Magazine';
import { Timeline } from './formats/Timeline';
import { filterByViewer } from '@/lib/logic/filter-facets';
import { Pitch, FacetId } from '@/lib/types/pitch';

const FORMAT_COMPONENTS = {
  'cards-grid': CardsGrid,
  'node-graph': NodeGraph,
  'magazine': Magazine,
  'timeline': Timeline,
};

export function PublicPitchView({ pitch }: { pitch: Pitch }) {
  const [selected, setSelected] = useState<FacetId[] | null>(null);
  const FormatComponent = FORMAT_COMPONENTS[pitch.format] ?? CardsGrid;

  if (selected === null) {
    return <ViewerOnboarding pitch={pitch} onConfirm={setSelected} />;
  }

  const filtered = filterByViewer(pitch.facets, pitch.edges, selected);

  return (
    <div className={`register-${pitch.register} format-${pitch.format}`}>
      <FacetToggleBar
        all={pitch.facets.map(f => f.id)}
        selected={selected}
        onToggle={setSelected}
      />
      <FormatComponent facets={filtered.facets} edges={filtered.edges} register={pitch.register} />
    </div>
  );
}
```

---

## 15. Format implementations

### CardsGrid (simplest, ~30 min)

```tsx
export function CardsGrid({ facets, register }: ...) {
  return (
    <div className="cards-grid">
      {facets.map(f => (
        <article key={f.id} className="facet">
          <h3>{f.title}</h3>
          <p>{f.content}</p>
        </article>
      ))}
    </div>
  );
}
```

CSS in `styles/formats/cards.css`. Register CSS modulates fonts/colors via `register-builder-led .cards-grid { ... }`.

### NodeGraph (~60 min)

```tsx
'use client';
import dynamic from 'next/dynamic';
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export function NodeGraph({ facets, edges, register }: ...) {
  const data = {
    nodes: facets.map(f => ({ id: f.id, name: f.title, content: f.content })),
    links: edges.map(e => ({ source: e.from, target: e.to, label: e.label }))
  };
  return (
    <ForceGraph2D
      graphData={data}
      nodeLabel="content"
      linkLabel="label"
      linkDirectionalArrowLength={4}
      backgroundColor={register === 'vision-led' ? '#F5F2EC' : '#FAFAFA'}
      nodeAutoColorBy="id"
    />
  );
}
```

`react-force-graph-2d` requires client-only rendering hence the dynamic import.

### Magazine (~60 min)

```tsx
export function Magazine({ facets, register }: ...) {
  const [first, ...rest] = facets;
  return (
    <div className="magazine">
      {first && (
        <section className="magazine-hero">
          <h1 className="magazine-hero-title">{first.title}</h1>
          <p className="magazine-dropcap">{first.content}</p>
        </section>
      )}
      <div className="magazine-spread">
        {rest.map(f => (
          <article key={f.id} className="magazine-column">
            <h2>{f.title}</h2>
            <p>{f.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
```

CSS in `styles/formats/magazine.css`: serif headers, drop cap, two-column flow.

### Timeline (~45 min)

```tsx
export function Timeline({ facets, register }: ...) {
  return (
    <ol className="timeline">
      {facets.map((f, i) => (
        <li key={f.id} className="timeline-item">
          <div className="timeline-marker" />
          <h3>{f.title}</h3>
          <p>{f.content}</p>
        </li>
      ))}
    </ol>
  );
}
```

Vertical line + dots via CSS.

---

## 16. Register CSS approach

Use CSS variables on a register-scoped class:

`styles/registers/builder-led.css`:

```css
.register-builder-led {
  --bg: #FAFAFA;
  --ink: #14110D;
  --muted: #6B6354;
  --accent: #C9483A;
  --line: #E0DAD0;
  --display-font: var(--font-geist);
  --body-font: var(--font-geist);
  --mono-font: var(--font-geist-mono);
  --density: tight;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--body-font);
}
```

`styles/registers/vision-led.css`:

```css
.register-vision-led {
  --bg: #F5F2EC;
  --ink: #14110D;
  --muted: #6B6354;
  --accent: #C9A14A;
  --line: #D8D0C2;
  --display-font: var(--font-fraunces);
  --body-font: var(--font-newsreader);
  --mono-font: var(--font-geist-mono);
  --density: spacious;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--body-font);
}
```

Format CSS reads these variables — so a card grid in builder-led looks different from a card grid in vision-led automatically.

---

## 17. CopilotKit integration points

CopilotKit provides three things we use:

1. `<CopilotKit publicApiKey={...}>` wrapper in the workspace (not on public view).
2. `useCopilotAction` per facet card for regenerate (see FacetCard above).
3. `useCopilotReadable` to expose the storyteller's current pitch state to the copilot for context-aware regeneration.

Wrap workspace in:

```tsx
'use client';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';

export function WorkspaceShell({ children }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      {children}
      <CopilotPopup />
    </CopilotKit>
  );
}
```

If CopilotKit setup eats more than 30 minutes, fall back to plain regenerate-buttons calling `/api/regenerate` directly. List CopilotKit in submission protocols regardless — the inline-editable cards are the spirit of CopilotKit even if the SDK isn't fully wired.

---

## 18. Testing checkpoints

| Time | Test | Pass condition |
|---|---|---|
| **1:35** | Smoke-test `detectShape()` on demo corpus | Returns valid archetype + outstandingCharacteristic |
| **1:50** | Smoke-test `extractPitch()` on demo corpus | Returns ≥4 facets and ≥3 edges |
| **2:30** | End-to-end `/api/generate` for applicant→startup | Full Pitch object in response |
| **2:45** | Workspace renders Pitch as facet cards | Cards visible, editable |
| **3:00** | Share endpoint → public URL → public view loads | Public page renders |
| **3:15** | Public view in cards-grid format | At least one register styled |
| **3:30** | Public view in node-graph format | Force graph visible with nodes + edges |
| **3:45** | Switch storyteller role to founder → re-generate → vision-led + different format | Visible change on screen |
| **4:00** | Two listeners pick different facets → public view differs | Two browser tabs show different content |

If a checkpoint is missed by more than 15 minutes, drop the next stretch goal and move on.

---

## 19. Common gotchas

- **`@google/genai` apiKey:** in Next.js server-side code, the env var is `process.env.GOOGLE_API_KEY` (must be on server only — never expose to client). Don't prefix with `NEXT_PUBLIC_`.
- **Gemini structured output:** use `responseJsonSchema` with the JSON Schema converted from Zod via `zod-to-json-schema`. Gemini 2.5 supports it. Some advanced JSON Schema features (`$ref`, `$defs`) can fail — keep schemas flat for now.
- **CORS / fetch in Next.js API routes:** Karmen's portfolio fetch must run server-side, not from the browser. Already arranged in `/api/generate` and `/api/ingest`.
- **In-memory store + dev hot reload:** the `global.__pitchStore` trick is required, otherwise Next.js wipes the Map on every code change.
- **react-force-graph-2d SSR:** must be `dynamic(..., { ssr: false })`. Will crash without.
- **CopilotKit runtimeUrl:** needs `/api/copilotkit/route.ts` set up with the official runtime adapter. If running short, skip CopilotKit's full runtime and use `useCopilotAction` only — which works without the runtime endpoint.
- **Empty facets:** Layer 3 should OMIT facets it can't populate. If the model returns empty-string content, drop those facets in post-processing before saving.
- **JSON parsing:** Gemini's structured output is reliable but not guaranteed. Wrap `JSON.parse` in try/catch and re-throw a user-friendly error.

---

## 20. Cut order (if behind)

In order, drop these to preserve the demo:

1. Per-facet regenerate (replace with section-level regenerate) — saves 30 min.
2. CopilotKit runtime (use `useCopilotAction` only or fall back to plain buttons).
3. Timeline format (keep cards + nodes + magazine).
4. Vision-led version of magazine + timeline (keep them in builder-led only).
5. Stub-format placeholder cards (drop entirely; map all stubs to cards-grid).
6. Magazine format (last resort — leaves cards + nodes only, but the demo still hits all 4 axes).

The demo MUST keep:
- Workspace generate flow with both relationships
- Public link reveal
- Cards-grid + node-graph in builder-led
- Layer 2 outputting different outstanding-characteristic per relationship
- Identity-stripping visible in README

---

## 21. Submission checklist (5:45–6:00)

- [ ] Public GitHub repo URL
- [ ] 2–3 min demo video link (Loom/YouTube unlisted)
- [ ] One-sentence pitch (from PRD)
- [ ] Protocols list: CopilotKit, A2UI, Gemini
- [ ] Team names + roles
- [ ] README transparency note: what was pre-existing (CopilotKit boilerplate, demo data, this PRD) vs built today
- [ ] README mentions stereotype safeguards
- [ ] Identity-stripping module visible in repo (`lib/logic/strip-identity.ts`)
