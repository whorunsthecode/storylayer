const PRONOUN_MAP: Record<string, string> = {
  he: 'they',
  him: 'them',
  his: 'their',
  himself: 'themself',
  she: 'they',
  her: 'their',
  hers: 'theirs',
  herself: 'themself',
  He: 'They',
  Him: 'Them',
  His: 'Their',
  She: 'They',
  Her: 'Their',
};

const NAME_PLACEHOLDER = 'the Person';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripIdentity(corpus: string, knownName?: string): string {
  let stripped = corpus;
  if (knownName && knownName.trim().length > 0) {
    const re = new RegExp(`\\b${escapeRegex(knownName)}\\b`, 'gi');
    stripped = stripped.replace(re, NAME_PLACEHOLDER);
  }
  for (const [from, to] of Object.entries(PRONOUN_MAP)) {
    stripped = stripped.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  }
  return stripped;
}
