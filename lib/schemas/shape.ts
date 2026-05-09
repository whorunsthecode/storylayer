import { z } from 'zod';

export const ShapeAndCharacteristicSchema = z.object({
  archetype: z.enum([
    'arc-of-pivots',
    'deepening-conviction',
    'builder-streak',
    'operator-builder',
    'domain-translator',
  ]),
  archetypeReasoning: z
    .string()
    .describe(
      'one short sentence (max 30 words) explaining why this archetype fits the corpus, addressed to the storyteller in second person'
    ),
  outstandingCharacteristic: z.enum([
    'shipped-output',
    'network-of-influence',
    'voice-and-writing',
    'structured-thinking',
    'journey-and-pivots',
    'conviction-and-thesis',
    'credentialed-track',
    'multidisciplinary-range',
    'quantified-impact',
  ]),
  characteristicReasoning: z
    .string()
    .describe(
      'one short sentence (max 30 words) on why this is foregrounded for THIS specific listener role — different listeners may foreground different characteristics'
    ),
});

export type ShapeAndCharacteristic = z.infer<typeof ShapeAndCharacteristicSchema>;
