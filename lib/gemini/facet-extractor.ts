import { z } from 'zod';
import { getAI } from './client';
import { ExtractionSchema, type Extraction } from '@/lib/schemas/extraction';

const EXTRACTION_JSON_SCHEMA = z.toJSONSchema(ExtractionSchema, { target: 'draft-7' });

const PROMPT = ({
  corpus,
  storytellerRole,
  listenerRole,
  register,
  archetype,
  outstandingCharacteristic,
  focusFacet,
}: {
  corpus: string;
  storytellerRole: string;
  listenerRole: string;
  register: string;
  archetype: string;
  outstandingCharacteristic: string;
  focusFacet?: string;
}) => `You are extracting a structured pitch from a redacted personal-story corpus AND assigning each facet a component type that fits the kind of content it is.

CRITICAL CONSTRAINTS:
- Do NOT reference or infer demographic attributes (gender, race, ethnicity, nationality, age).
- Do NOT use forbidden patterns ("people like you", "for someone with your background", "as a [demographic]").
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

Extract these facets — only if the corpus contains material to populate them. If a facet has no support in the corpus, OMIT it entirely:

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

PER-FACET COMPONENT ASSIGNMENT
For EACH facet you include, pick the component type that best fits the kind of content it carries. The principle: different thoughts warrant different containers. Don't default to one type — pick based on the actual material in the corpus.

The seven component types:

1. node-graph — choose when the facet has multiple connected entities (e.g. several distinct projects, a network of collaborators, multiple domains that link to each other). Populate "nodes" (3-7 nodes, each with id+label, optional hint) AND "connections" (edges between those nodes with verb-phrase labels like "led to", "shaped", "drives").

2. metric-grid — choose when the facet contains specific numbers (users, revenue, growth %, raise amounts, durations at specific scales). Populate "metrics" (2-5 entries, each with value/label/context). Pull the actual numbers from the corpus — do not invent.

3. timeline-strip — choose for chronological narratives (arc-of-pivots, formative-experience with clear before/after, career progression). Populate "events" (3-6 entries, each with eyebrow/title/content).

4. quote-manifesto — choose when the corpus contains a strong declarative belief (vision, values with a clear stance). Populate "quote" with the strongest single belief sentence (verbatim or near-verbatim from the corpus).

5. skill-constellation — choose for breadth-without-narrative (range, how-i-work as a stack of styles). Populate "skills" (5-12 pills, each with name and weight 1-3 reflecting prominence in the corpus).

6. chapter-spread — choose for a single coherent narrative passage (origin, formative-experience without multiple events). Populate "eyebrow" (a short tag/year), keep title + content.

7. facet-card — DEFAULT, only use when none of the above fit. Just title + content.

For EVERY facet, always populate "title" (2-5 evocative words) and "content" (2-3 sentence prose summary, used as accessible fallback).

GUIDANCE BY FACET ID (suggestions, not rigid rules):
- values, vision → quote-manifesto if a strong belief exists, else facet-card
- formative-experience → chapter-spread if one moment, timeline-strip if a sequence
- origin → chapter-spread
- shipped-work → metric-grid if numbers exist, else node-graph if multiple distinct projects, else timeline-strip
- range → skill-constellation OR node-graph (if domains connect)
- how-i-work → skill-constellation
- fundraising-track → metric-grid
- looking-for → facet-card or quote-manifesto
- outside-interests → skill-constellation or facet-card

${focusFacet ? `\nFOCUS: Regenerate ONLY the "${focusFacet}" facet with fresh phrasing. Output a single facet in the facets array.\n` : ''}
Output JSON matching the provided schema. Be precise with structured data — empty arrays should be omitted, not included.`;

export async function extractPitch(args: {
  corpus: string;
  storytellerRole: string;
  listenerRole: string;
  register: string;
  archetype: string;
  outstandingCharacteristic: string;
  focusFacet?: string;
}): Promise<Extraction> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: PROMPT(args),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: EXTRACTION_JSON_SCHEMA,
      temperature: 0.6,
    },
  });
  const text = response.text;
  if (!text) throw new Error('facet extraction returned empty response');
  const parsed = JSON.parse(text);
  const extraction = ExtractionSchema.parse(parsed);
  // Drop empty facets defensively
  extraction.facets = extraction.facets.filter(
    (f) => f.content && f.content.trim().length > 0
  );
  return extraction;
}
