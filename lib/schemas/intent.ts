import { z } from 'zod';
import { FacetIdEnum } from './extraction';

export const ListenerIntentSchema = z.object({
  selectedFacetIds: z.array(FacetIdEnum).min(2).max(5).describe(
    'Pick 2-5 facets that best serve THIS listener at THIS moment based on their stated intent.'
  ),
  reasoning: z
    .string()
    .describe(
      'one short sentence (max 35 words) explaining why these facets were picked, addressed to the listener in second person ("You said you want X, so I surfaced Y and Z")'
    ),
});

export type ListenerIntent = z.infer<typeof ListenerIntentSchema>;
