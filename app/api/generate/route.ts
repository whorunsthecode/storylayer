import { NextResponse } from 'next/server';
import { stripIdentity } from '@/lib/logic/strip-identity';
import { pickRegister } from '@/lib/logic/pick-register';
import { detectShape } from '@/lib/gemini/shape-detector';
import { extractPitch } from '@/lib/gemini/facet-extractor';
import { fetchAndExtract, BlockedHostError } from '@/lib/fetch/url-fetcher';
import type {
  DataSource,
  GenerateResult,
  StorytellerRole,
  ListenerRole,
} from '@/lib/types/pitch';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface Body {
  sources: DataSource[];
  storytellerRole: StorytellerRole;
  listenerRole: ListenerRole;
  knownName?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { sources, storytellerRole, listenerRole, knownName } = body;
  if (!Array.isArray(sources) || sources.length === 0) {
    return NextResponse.json({ error: 'No sources provided' }, { status: 400 });
  }

  // Aggregate corpus
  const parts: string[] = [];
  const sourceDiagnostics: { label: string; ok: boolean; reason?: string; chars?: number }[] = [];
  for (const s of sources) {
    try {
      if (s.type === 'url') {
        if (!s.url || !s.url.trim()) {
          sourceDiagnostics.push({ label: s.label, ok: false, reason: 'empty URL' });
          continue;
        }
        const text = await fetchAndExtract(s.url);
        const trimmed = text.trim();
        if (!trimmed) {
          sourceDiagnostics.push({ label: s.label, ok: false, reason: 'fetched page had no readable text' });
          continue;
        }
        parts.push(`### ${s.label}\n${trimmed}`);
        sourceDiagnostics.push({ label: s.label, ok: true, chars: trimmed.length });
      } else {
        const trimmed = (s.content ?? '').trim();
        if (!trimmed) {
          sourceDiagnostics.push({ label: s.label, ok: false, reason: 'empty text' });
          continue;
        }
        parts.push(`### ${s.label}\n${trimmed}`);
        sourceDiagnostics.push({ label: s.label, ok: true, chars: trimmed.length });
      }
    } catch (err) {
      const reason =
        err instanceof BlockedHostError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'unknown error';
      console.warn('source fetch failed', s.label, reason);
      sourceDiagnostics.push({ label: s.label, ok: false, reason });
    }
  }

  if (parts.length === 0) {
    return NextResponse.json(
      {
        error: 'No usable content extracted from sources.',
        sources: sourceDiagnostics,
      },
      { status: 400 }
    );
  }

  const rawCorpus = parts.join('\n\n');
  const corpus = stripIdentity(rawCorpus, knownName);

  try {
    const register = pickRegister(storytellerRole, listenerRole);

    const { archetype, outstandingCharacteristic, archetypeReasoning, characteristicReasoning } =
      await detectShape({
        corpus,
        storytellerRole,
        listenerRole,
      });

    const { facets } = await extractPitch({
      corpus,
      storytellerRole,
      listenerRole,
      register,
      archetype,
      outstandingCharacteristic,
    });

    const result: GenerateResult = {
      storytellerRole,
      listenerRole,
      register,
      archetype,
      outstandingCharacteristic,
      archetypeReasoning,
      characteristicReasoning,
      facets,
      redactedCorpus: corpus,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('generate failed', err);
    const msg = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
