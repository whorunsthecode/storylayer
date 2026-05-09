import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAI } from '@/lib/gemini/client';
import { getPitch } from '@/lib/storage/memory-store';
import { ListenerIntentSchema } from '@/lib/schemas/intent';

export const runtime = 'nodejs';
export const maxDuration = 300;

const INTENT_JSON_SCHEMA = z.toJSONSchema(ListenerIntentSchema, { target: 'draft-7' });

interface Body {
  pitchId: string;
  intent: string;
  previousReasoning?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.intent?.trim()) {
    return NextResponse.json({ error: 'intent text required' }, { status: 400 });
  }

  const pitch = getPitch(body.pitchId);
  if (!pitch) {
    return NextResponse.json({ error: 'pitch not found' }, { status: 404 });
  }

  const availableFacets = pitch.facets
    .map((f) => `- ${f.id} ("${f.title}", component: ${f.componentType}): ${f.content.slice(0, 140)}…`)
    .join('\n');

  const prompt = `You are picking which parts of an existing pitch to surface for THIS specific listener at THIS moment.

CRITICAL CONSTRAINTS:
- Do NOT reference or infer demographic attributes about the storyteller (gender, race, ethnicity, nationality, age).
- Decide based ONLY on what the listener said they want to learn AND the available facet content.
- The corpus was redacted at generation time — name → "the Person", pronouns neutralised.
- Reasoning must be in SECOND PERSON addressed to the LISTENER ("You said... so I surfaced..."). Never address the storyteller.

CONTEXT:
- The storyteller pitches as: ${pitch.storytellerRole}
- The listener role: ${pitch.listenerRole}
- Visual register: ${pitch.register}
- Outstanding characteristic identified: ${pitch.outstandingCharacteristic}

LISTENER INTENT (their own words):
"${body.intent}"

${body.previousReasoning ? `PREVIOUS RENDER reasoning (the listener is refining): "${body.previousReasoning}"\nThe listener wants you to remix from where they were. Adjust selection to honor their refinement.\n` : ''}

AVAILABLE FACETS (the storyteller's full pitch — pick 2-5 that best serve this listener):
${availableFacets}

Output JSON matching the schema. Pick 2-5 facet ids only. The reasoning sentence should make explicit what the listener said and which facets best speak to that — be concrete, not generic.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: INTENT_JSON_SCHEMA,
        temperature: 0.5,
      },
    });
    const text = response.text;
    if (!text) throw new Error('intent endpoint returned empty response');
    const parsed = JSON.parse(text);
    const validated = ListenerIntentSchema.parse(parsed);
    // Filter out any picked ids that don't actually exist in the pitch (defensive)
    const realIds = new Set(pitch.facets.map((f) => f.id));
    validated.selectedFacetIds = validated.selectedFacetIds.filter((id) => realIds.has(id));
    if (validated.selectedFacetIds.length < 2) {
      // Fallback to weight-ordered top 3 if the LLM gave us nothing usable
      validated.selectedFacetIds = pitch.facets
        .slice()
        .sort((a, b) => {
          const order: Record<string, number> = { hero: 0, feature: 1, supporting: 2 };
          return (order[a.weight] ?? 9) - (order[b.weight] ?? 9);
        })
        .slice(0, 3)
        .map((f) => f.id);
    }
    return NextResponse.json(validated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'intent failed';
    console.error('intent endpoint error', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
