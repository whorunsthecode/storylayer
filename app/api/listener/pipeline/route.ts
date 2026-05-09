import type { NextRequest } from 'next/server';
import { Type, FunctionCallingConfigMode } from '@google/genai';
import { z } from 'zod';
import { getAI } from '@/lib/gemini/client';
import { getPitch } from '@/lib/storage/memory-store';
import { findEvidenceInCorpus, type EvidenceQuote } from '@/lib/tools/find-evidence';
import { FacetIdEnum } from '@/lib/schemas/extraction';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Tool declaration — MCP-shape: the agent decides whether/when to invoke this.
const findEvidenceTool = {
  functionDeclarations: [
    {
      name: 'find_evidence_in_corpus',
      description:
        'Search the storyteller corpus for sentences that support a specific facet or claim. Use this to ground your facet selections in actual evidence from the corpus rather than guessing. Call this for each facet you are seriously considering — if a facet has no evidence in the corpus, do not select it.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          facetId: {
            type: Type.STRING,
            description: 'Which facet you want evidence for (one of the available facet ids).',
          },
          searchTerms: {
            type: Type.STRING,
            description: 'Comma-separated keywords or themes related to the facet.',
          },
        },
        required: ['facetId', 'searchTerms'],
      },
    },
  ],
};

const PipelineResultSchema = z.object({
  selectedFacetIds: z.array(FacetIdEnum).min(2).max(5),
  reasoning: z.string(),
  evidence: z
    .record(z.string(), z.array(z.string()))
    .describe('map of facetId to top evidence quote strings drawn from corpus'),
});

interface Body {
  pitchId: string;
  intent: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const pitch = getPitch(body.pitchId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        if (!pitch) {
          send({ type: 'error', message: 'Pitch not found' });
          controller.close();
          return;
        }
        if (!body.intent?.trim()) {
          send({ type: 'error', message: 'Intent text required' });
          controller.close();
          return;
        }

        // STEP 1 — parse intent
        send({ type: 'step', step: 'parse_intent', message: 'Reading your intent…' });
        await new Promise((r) => setTimeout(r, 200));

        // Build prompt
        const availableFacets = pitch.facets
          .map(
            (f) =>
              `- ${f.id} ("${f.title}", component: ${f.componentType}): ${f.content.slice(0, 160)}…`
          )
          .join('\n');

        const systemPrompt = `You are picking which parts of an existing pitch to surface for THIS specific listener at THIS moment.

YOUR PROCESS:
1. Parse the listener's intent — what are they really trying to learn?
2. For each facet that might be relevant, USE the find_evidence_in_corpus tool to check if there's actual supporting material in the storyteller's corpus.
3. Only finalize facets that have at least medium-relevance evidence.
4. If a candidate facet returns nothing, try a different facet.
5. Return your final selection.

CRITICAL CONSTRAINTS:
- Do NOT reference or infer demographic attributes about the storyteller.
- Pick facets ONLY based on the listener's stated intent + actual corpus evidence.
- Reasoning addressed to the listener in second person ("You said... so I surfaced...").

CONTEXT:
- Storyteller pitches as: ${pitch.storytellerRole}
- Listener role: ${pitch.listenerRole}
- Visual register: ${pitch.register}
- Outstanding characteristic: ${pitch.outstandingCharacteristic}

LISTENER INTENT (their own words):
"${body.intent}"

AVAILABLE FACETS (the storyteller's full pitch — pick 2-5):
${availableFacets}

Begin. Use the find_evidence_in_corpus tool freely to ground your decisions before committing.`;

        // STEP 2 — agent reasons + may call tools
        send({
          type: 'step',
          step: 'reasoning',
          message: 'Selecting facets and grounding them in evidence…',
        });

        const evidence: Record<string, EvidenceQuote[]> = {};

        const ai = getAI();
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash-lite',
          config: {
            tools: [findEvidenceTool],
            toolConfig: {
              functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
            },
            temperature: 0.4,
          },
        });

        let response = await chat.sendMessage({ message: systemPrompt });
        let toolIterations = 0;
        const MAX_ITERATIONS = 8;

        while (
          response.functionCalls &&
          response.functionCalls.length > 0 &&
          toolIterations < MAX_ITERATIONS
        ) {
          const responses = [];
          for (const call of response.functionCalls) {
            const args = (call.args ?? {}) as { facetId?: string; searchTerms?: string };
            send({
              type: 'tool_call',
              name: call.name,
              args,
              iteration: toolIterations + 1,
            });

            const facetId = args.facetId ?? '';
            const searchTerms = args.searchTerms ?? '';
            const quotes = findEvidenceInCorpus(pitch.redactedCorpus ?? '', searchTerms);
            evidence[facetId] = quotes;

            send({
              type: 'tool_result',
              name: call.name,
              facetId,
              quoteCount: quotes.length,
              topRelevance: quotes[0]?.relevance ?? 'none',
            });

            responses.push({
              functionResponse: {
                name: call.name ?? 'find_evidence_in_corpus',
                response: {
                  quotes: quotes.map((q) => `[${q.relevance}] ${q.text}`),
                  count: quotes.length,
                },
              },
            });
          }

          response = await chat.sendMessage({ message: responses });
          toolIterations++;
        }

        // STEP 3 — final structured output
        send({ type: 'step', step: 'finalizing', message: 'Composing the final selection…' });

        const finalResponse = await chat.sendMessage({
          message:
            'Now output your final selection as JSON matching the provided schema. Include only facets you found evidence for. Map each selected facetId to its top 1-2 evidence quote text strings.',
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: z.toJSONSchema(PipelineResultSchema, { target: 'draft-7' }),
          },
        });

        const finalText = finalResponse.text;
        if (!finalText) {
          send({ type: 'error', message: 'final response empty' });
          controller.close();
          return;
        }
        const parsed = JSON.parse(finalText);
        const result = PipelineResultSchema.parse(parsed);

        // Filter selected ids to those that actually exist in the pitch (defensive)
        const realIds = new Set(pitch.facets.map((f) => f.id));
        result.selectedFacetIds = result.selectedFacetIds.filter((id) =>
          realIds.has(id)
        );
        if (result.selectedFacetIds.length < 2) {
          // graceful fallback — surface highest-weight facets
          const order: Record<string, number> = { hero: 0, feature: 1, supporting: 2 };
          result.selectedFacetIds = pitch.facets
            .slice()
            .sort((a, b) => (order[a.weight] ?? 9) - (order[b.weight] ?? 9))
            .slice(0, 3)
            .map((f) => f.id);
        }

        // Compose outgoing evidence map: prefer model's evidence, fall back to tool log
        const outgoingEvidence: Record<string, string[]> = {};
        for (const id of result.selectedFacetIds) {
          const fromModel = result.evidence?.[id];
          const fromLog = (evidence[id] ?? []).slice(0, 2).map((q) => q.text);
          outgoingEvidence[id] =
            fromModel && fromModel.length > 0 ? fromModel.slice(0, 2) : fromLog;
        }

        send({
          type: 'result',
          selectedFacetIds: result.selectedFacetIds,
          reasoning: result.reasoning,
          evidence: outgoingEvidence,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'pipeline failed';
        console.error('pipeline error', err);
        send({ type: 'error', message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
