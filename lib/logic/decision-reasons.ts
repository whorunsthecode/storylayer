import type {
  ListenerRole,
  OutstandingCharacteristic,
  StorytellerRole,
} from '@/lib/types/pitch';

export const REGISTER_REASONS: Record<string, string> = {
  'applicant-startup': 'applicant pitching a startup — builder-led conventions',
  'founder-investor': 'founder pitching investor — vision-led conventions',
  'investor-founder': 'investor pitching founder — trust-led conventions',
  'startup-applicant': 'startup pitching candidate — mission-led conventions',
  'cofounder-cofounder': 'cofounder match — chemistry-led conventions',
};

// "Format reason" — keyed on outstanding characteristic. In the
// component-per-facet world, this becomes the rationale for the *composition*
// — i.e., why these component types end up dominating the page given the
// storyteller's standout strength.
export const FORMAT_REASONS: Record<OutstandingCharacteristic, string> = {
  'shipped-output': 'concrete shipped work is the strongest evidence',
  'network-of-influence': 'connections between facets are the signal',
  'voice-and-writing': 'distinctive voice carries best in long-form',
  'structured-thinking': 'frameworks read clearest as a process',
  'journey-and-pivots': 'the arc itself is the story',
  'conviction-and-thesis': 'a single declarative claim does the work',
  'credentialed-track': 'credentials read clearest in structured layout',
  'multidisciplinary-range': 'connections across domains are the strength',
  'quantified-impact': 'numbers carry the message at a glance',
};

export function reasonForRegister(s: StorytellerRole, l: ListenerRole): string {
  return REGISTER_REASONS[`${s}-${l}`] ?? `${s}-to-${l} relationship`;
}

export function reasonForFormat(oc: OutstandingCharacteristic): string {
  return FORMAT_REASONS[oc] ?? 'default fit';
}
