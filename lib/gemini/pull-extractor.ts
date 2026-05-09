import { z } from 'zod';
import { getAI } from './client';
import { PullResponseSchema, PULL_ACTION_INTENTS, type PullAction, type PullResponse } from '@/lib/schemas/pull';
import type { Facet, OutstandingCharacteristic, Register, StorytellerRole, ListenerRole } from '@/lib/types/pitch';

const PULL_JSON_SCHEMA = z.toJSONSchema(PullResponseSchema, { target: 'draft-7' });

const PROMPT = ({
  corpus,
  facet,
  action,
  storytellerRole,
  listenerRole,
  register,
  outstandingCharacteristic,
}: {
  corpus: string;
  facet: Facet;
  action: PullAction;
  storytellerRole: StorytellerRole;
  listenerRole: ListenerRole;
  register: Register;
  outstandingCharacteristic: OutstandingCharacteristic;
}) => {
  const actionMeta = PULL_ACTION_INTENTS[action];
  return `You are extending a facet of a personal-story pitch with a deeper / sideways component, in response to a listener gesture.

CRITICAL CONSTRAINTS:
- Do NOT reference or infer demographic attributes (gender, race, ethnicity, nationality, age).
- Decide based ONLY on stated work, projects, education, and writing in the corpus.
- The corpus is redacted: name → "the Person", pronouns neutralised.

CONTEXT:
- Storyteller pitches as: ${storytellerRole}
- Listener reads as: ${listenerRole}
- Visual register: ${register}
- Outstanding characteristic: ${outstandingCharacteristic}

THE FACET BEING EXTENDED:
- id: ${facet.id}
- title: ${facet.title}
- componentType: ${facet.componentType}
- content: ${facet.content}
${facet.metrics?.length ? `- existing metrics on this facet: ${JSON.stringify(facet.metrics)}` : ''}
${facet.events?.length ? `- existing events: ${JSON.stringify(facet.events)}` : ''}
${facet.nodes?.length ? `- existing nodes: ${JSON.stringify(facet.nodes)}` : ''}
${facet.connections?.length ? `- existing connections: ${JSON.stringify(facet.connections)}` : ''}
${facet.skills?.length ? `- existing skills: ${JSON.stringify(facet.skills)}` : ''}
${facet.quote ? `- existing quote: ${JSON.stringify(facet.quote)}` : ''}

LISTENER GESTURE: "${actionMeta.label}"
INTENT: ${actionMeta.intent}

CORPUS:
${corpus}

Output JSON for ONE new component to render directly below this facet as a thread. Schema fields:

- "componentType": Pick what best serves the gesture. Prefer one of: ${actionMeta.preferTypes.join(', ')} — but pick a different type if the corpus material clearly warrants it (e.g. show-proof on a corpus full of named institutions might warrant chapter-spread). Component types available: node-graph, metric-grid, timeline-strip, quote-manifesto, skill-constellation, chapter-spread, facet-card.

- "title": Short evocative label (2-5 words). Should signal the gesture — "Behind the numbers", "Where it came from", "How it connects".

- "content": 2-3 sentence prose summary, used as accessible fallback.

- "emphasis": One word the eye should land on first (number, name, or verb). Skip if no single word stands out.

- Then populate the structured-data fields that match componentType (metrics / events / nodes+connections / skills / quote / eyebrow). Only populate the fields that match the chosen componentType. Pull the actual material from the corpus — do not invent numbers or projects that aren't there.

The thread should feel like a NATURAL DEEPENING of the original facet, not a restatement. If the originating facet ALREADY has structured data (metrics/events/etc.) that match the gesture, you can REUSE that data — for example, if show-proof is gestured on a metric-grid facet that already has 7 metrics, return a metric-grid that re-foregrounds 3-5 of those with sharper context. Only return a facet-card placeholder if the corpus genuinely has no material — that should be rare.`;
};

export async function pullComponent(args: {
  corpus: string;
  facet: Facet;
  action: PullAction;
  storytellerRole: StorytellerRole;
  listenerRole: ListenerRole;
  register: Register;
  outstandingCharacteristic: OutstandingCharacteristic;
}): Promise<PullResponse> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: PROMPT(args),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: PULL_JSON_SCHEMA,
      temperature: 0.7,
    },
  });
  const text = response.text;
  if (!text) throw new Error('pull returned empty response');
  const parsed = JSON.parse(text);
  return PullResponseSchema.parse(parsed);
}
