import type { Format, OutstandingCharacteristic } from '@/lib/types/pitch';

export const BUILT_FORMATS: Format[] = ['cards-grid', 'node-graph', 'magazine', 'timeline'];

const IDEAL_MAP: Record<OutstandingCharacteristic, Format> = {
  'shipped-output': 'portfolio-gallery',
  'network-of-influence': 'node-graph',
  'voice-and-writing': 'magazine',
  'structured-thinking': 'process-diagram',
  'journey-and-pivots': 'timeline',
  'conviction-and-thesis': 'manifesto',
  'credentialed-track': 'annotated-cv',
  'multidisciplinary-range': 'map-constellation',
  'quantified-impact': 'data-dashboard',
};

// Stubbed formats fall back to one of the 4 built formats. Each fallback is
// chosen to preserve the *spirit* of the ideal format:
//   portfolio-gallery → timeline   (chronology of shipped work)
//   data-dashboard    → magazine   (numbers as pull-quotes / headlines)
//   process-diagram   → node-graph (process as connected nodes)
//   map-constellation → node-graph (constellation = nodes in space)
//   manifesto         → magazine   (declarative single-page in editorial type)
//   annotated-cv      → magazine   (structured editorial with marginalia)
//   conversation      → magazine   (Q&A in editorial layout)
//   network-of-people → node-graph (social graph = node graph)
const FALLBACK: Partial<Record<Format, Format>> = {
  'portfolio-gallery': 'timeline',
  'data-dashboard':    'magazine',
  'process-diagram':   'node-graph',
  'map-constellation': 'node-graph',
  'manifesto':         'magazine',
  'annotated-cv':      'magazine',
  'conversation':      'magazine',
  'network-of-people': 'node-graph',
};

export function pickFormatIdeal(oc: OutstandingCharacteristic): Format {
  return IDEAL_MAP[oc];
}

export function pickFormat(oc: OutstandingCharacteristic): Format {
  const ideal = IDEAL_MAP[oc];
  if (BUILT_FORMATS.includes(ideal)) return ideal;
  return FALLBACK[ideal] ?? 'cards-grid';
}

export function getStubReason(
  oc: OutstandingCharacteristic
): { ideal: Format; fallback: Format } | null {
  const ideal = pickFormatIdeal(oc);
  const fallback = pickFormat(oc);
  return ideal !== fallback ? { ideal, fallback } : null;
}
