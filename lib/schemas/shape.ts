import { z } from 'zod';

export const ShapeAndCharacteristicSchema = z.object({
  archetype: z.enum([
    'arc-of-pivots',
    'deepening-conviction',
    'builder-streak',
    'operator-builder',
    'domain-translator',
  ]),
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
  reasoning: z
    .string()
    .describe('one-sentence rationale, written in second person addressing the storyteller'),
});

export type ShapeAndCharacteristic = z.infer<typeof ShapeAndCharacteristicSchema>;
