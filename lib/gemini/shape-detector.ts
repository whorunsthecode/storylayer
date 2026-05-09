import { z } from 'zod';
import { getAI } from './client';
import {
  ShapeAndCharacteristicSchema,
  type ShapeAndCharacteristic,
} from '@/lib/schemas/shape';

const SHAPE_JSON_SCHEMA = z.toJSONSchema(ShapeAndCharacteristicSchema, { target: 'draft-7' });

const PROMPT = ({
  corpus,
  storytellerRole,
  listenerRole,
}: {
  corpus: string;
  storytellerRole: string;
  listenerRole: string;
}) => `You are categorizing a redacted personal-story corpus by:
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

ARCHETYPE OPTIONS (pick exactly one):
- arc-of-pivots: multi-disciplinary, story is the thread connecting otherwise distinct chapters
- deepening-conviction: single domain, increasing depth and stakes
- builder-streak: shipped work compounds steadily
- operator-builder: execution and scaling expertise
- domain-translator: bridges between fields

OUTSTANDING CHARACTERISTIC OPTIONS (pick exactly one):
- shipped-output: lots of concrete shipped work
- network-of-influence: strong connections, collaborators, mentions
- voice-and-writing: distinctive written voice, articles, posts
- structured-thinking: frameworks, methodologies, system thinking
- journey-and-pivots: compelling arc with meaningful shifts
- conviction-and-thesis: strong contrarian views, clear stance
- credentialed-track: degrees, awards, named institutions
- multidisciplinary-range: breadth across distinct domains
- quantified-impact: numbers, metrics, scale, financial outcomes

CORPUS:
${corpus}

Output JSON matching the provided schema. For "outstandingCharacteristic", choose what would matter MOST to the listener role given their context. The same corpus may have a different outstanding characteristic for different listeners — that is intentional.

Provide TWO separate reasoning fields:
- "archetypeReasoning": one short sentence (max 30 words) on why this archetype fits the corpus, in second person addressing the storyteller. Focus on the *shape* of the career — connections, progression, range.
- "characteristicReasoning": one short sentence (max 30 words) on why this characteristic is foregrounded *for this specific listener role*. Make explicit what this listener cares about that makes this characteristic stand out. A different listener might foreground a different one — say so when relevant.`;

export async function detectShape(args: {
  corpus: string;
  storytellerRole: string;
  listenerRole: string;
}): Promise<ShapeAndCharacteristic> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: PROMPT(args),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: SHAPE_JSON_SCHEMA,
      temperature: 0.4,
    },
  });
  const text = response.text;
  if (!text) throw new Error('shape detection returned empty response');
  const parsed = JSON.parse(text);
  return ShapeAndCharacteristicSchema.parse(parsed);
}
