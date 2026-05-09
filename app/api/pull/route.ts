import { NextResponse } from 'next/server';
import { getPitch } from '@/lib/storage/memory-store';
import { pullComponent } from '@/lib/gemini/pull-extractor';
import type { PullAction } from '@/lib/schemas/pull';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface Body {
  pitchId: string;
  facetId: string;
  action: PullAction;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const pitch = getPitch(body.pitchId);
  if (!pitch) {
    return NextResponse.json({ error: 'pitch not found' }, { status: 404 });
  }

  const facet = pitch.facets.find((f) => f.id === body.facetId);
  if (!facet) {
    return NextResponse.json({ error: 'facet not found in pitch' }, { status: 404 });
  }

  // The pull endpoint operates on the persisted pitch so it doesn't need the original
  // sources / corpus — the facet's content + pitch context is enough.
  // We use the facet's content as the local corpus for the LLM. Identity-stripping
  // already happened upstream when the pitch was generated.
  try {
    const component = await pullComponent({
      corpus: pitch.facets.map((f) => `### ${f.id}\n${f.content}`).join('\n\n'),
      facet,
      action: body.action,
      storytellerRole: pitch.storytellerRole,
      listenerRole: pitch.listenerRole,
      register: pitch.register,
      outstandingCharacteristic: pitch.outstandingCharacteristic,
    });
    return NextResponse.json({ component });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Pull failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
