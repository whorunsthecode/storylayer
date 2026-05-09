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

const FALLBACK: Partial<Record<Format, Format>> = {
  'manifesto': 'magazine',
  'annotated-cv': 'magazine',
  'portfolio-gallery': 'cards-grid',
  'data-dashboard': 'cards-grid',
  'map-constellation': 'node-graph',
  'process-diagram': 'cards-grid',
  'conversation': 'magazine',
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
