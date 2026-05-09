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
}) => `You are extracting a structured pitch from a redacted personal-story corpus.

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
- "content" should be 2-4 sentences, written in voice appropriate to the register, addressed to the listener. Speak about "the Person" or in second-person ("you") if natural — never use a real name.

Then identify edges — connections between facets that are SPECIFIC to this person (not generic). Each edge has from, to, and a short label describing the relationship (e.g., "drives", "shaped", "demonstrates"). Aim for 3-6 edges total.

${focusFacet ? `\nFOCUS: Regenerate ONLY the "${focusFacet}" facet with fresh phrasing (still tuned to register + listener). Output a single facet in the facets array, and an empty edges array.\n` : ''}
Output JSON matching the provided schema.`;

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
