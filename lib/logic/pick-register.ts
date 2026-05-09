import type { Register, StorytellerRole, ListenerRole } from '@/lib/types/pitch';

const MAP: Record<string, Register> = {
  'founder-investor': 'vision-led',
  'investor-founder': 'trust-led',
  'applicant-startup': 'builder-led',
  'startup-applicant': 'mission-led',
  'cofounder-cofounder': 'chemistry-led',
};

export function pickRegister(s: StorytellerRole, l: ListenerRole): Register {
  return MAP[`${s}-${l}`] ?? 'builder-led';
}
