import { NextResponse } from 'next/server';
import { stripIdentity } from '@/lib/logic/strip-identity';
import { extractPitch } from '@/lib/gemini/facet-extractor';
import { fetchAndExtract } from '@/lib/fetch/url-fetcher';
import type {
  DataSource,
  StorytellerRole,
  ListenerRole,
  Register,
  Archetype,
  OutstandingCharacteristic,
  FacetId,
  Facet,
} from '@/lib/types/pitch';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface Body {
  sources: DataSource[];
  storytellerRole: StorytellerRole;
  listenerRole: ListenerRole;
  register: Register;
  archetype: Archetype;
  outstandingCharacteristic: OutstandingCharacteristic;
  focusFacet: FacetId;
  hint?: string;
  knownName?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parts: string[] = [];
  for (const s of body.sources) {
    try {
      if (s.type === 'url' && s.url) {
        const text = await fetchAndExtract(s.url);
        if (text.trim()) parts.push(`### ${s.label}\n${text}`);
      } else if (s.type === 'text' && s.content) {
        parts.push(`### ${s.label}\n${s.content}`);
      }
    } catch {
      // skip
    }
  }
  const corpus = stripIdentity(parts.join('\n\n'), body.knownName);

  try {
    const { facets } = await extractPitch({
      corpus,
      storytellerRole: body.storytellerRole,
      listenerRole: body.listenerRole,
      register: body.register,
      archetype: body.archetype,
      outstandingCharacteristic: body.outstandingCharacteristic,
      focusFacet: body.focusFacet,
      hint: body.hint,
    });

    const facet: Facet | undefined = facets.find((f) => f.id === body.focusFacet) ?? facets[0];
    if (!facet) {
      return NextResponse.json({ error: 'No facet returned' }, { status: 500 });
    }
    return NextResponse.json({ facet });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Regenerate failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
