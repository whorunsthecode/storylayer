import type {
  Archetype,
  FacetId,
  Format,
  ListenerRole,
  OutstandingCharacteristic,
  Register,
  StorytellerRole,
} from '@/lib/types/pitch';

export const STORYTELLER_OPTIONS: { value: StorytellerRole; label: string }[] = [
  { value: 'applicant', label: 'Applicant' },
  { value: 'founder', label: 'Founder' },
  { value: 'investor', label: 'Investor' },
  { value: 'startup', label: 'Startup' },
  { value: 'cofounder', label: 'Cofounder' },
];

export const LISTENER_OPTIONS: { value: ListenerRole; label: string }[] = [
  { value: 'startup', label: 'Startup' },
  { value: 'investor', label: 'Investor' },
  { value: 'founder', label: 'Founder' },
  { value: 'applicant', label: 'Applicant' },
  { value: 'cofounder', label: 'Cofounder' },
];

export const FACET_LABELS: Record<FacetId, string> = {
  values: 'values',
  'formative-experience': 'formative experience',
  origin: 'origin',
  'shipped-work': 'shipped work',
  range: 'range',
  vision: 'vision',
  'fundraising-track': 'fundraising track',
  'looking-for': 'looking for',
  'how-i-work': 'how i work',
  'outside-interests': 'outside interests',
};

export const REGISTER_LABEL: Record<Register, string> = {
  'vision-led': 'vision-led',
  'trust-led': 'trust-led',
  'builder-led': 'builder-led',
  'mission-led': 'mission-led',
  'chemistry-led': 'chemistry-led',
};

export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  'arc-of-pivots': 'arc of pivots',
  'deepening-conviction': 'deepening conviction',
  'builder-streak': 'builder streak',
  'operator-builder': 'operator-builder',
  'domain-translator': 'domain translator',
};

export const OC_LABEL: Record<OutstandingCharacteristic, string> = {
  'shipped-output': 'shipped output',
  'network-of-influence': 'network of influence',
  'voice-and-writing': 'voice and writing',
  'structured-thinking': 'structured thinking',
  'journey-and-pivots': 'journey and pivots',
  'conviction-and-thesis': 'conviction and thesis',
  'credentialed-track': 'credentialed track',
  'multidisciplinary-range': 'multidisciplinary range',
  'quantified-impact': 'quantified impact',
};

export const FORMAT_LABEL: Record<Format, string> = {
  'cards-grid': 'cards grid',
  'node-graph': 'node graph',
  magazine: 'magazine',
  timeline: 'timeline',
  'portfolio-gallery': 'portfolio gallery',
  'data-dashboard': 'data dashboard',
  'map-constellation': 'map constellation',
  manifesto: 'manifesto',
  'process-diagram': 'process diagram',
  conversation: 'conversation',
  'annotated-cv': 'annotated cv',
  'network-of-people': 'network of people',
};
