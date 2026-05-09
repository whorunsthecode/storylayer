import { z } from 'zod';

export const FacetIdEnum = z.enum([
  'values',
  'formative-experience',
  'origin',
  'shipped-work',
  'range',
  'vision',
  'fundraising-track',
  'looking-for',
  'how-i-work',
  'outside-interests',
]);

export const FacetSchema = z.object({
  id: FacetIdEnum,
  title: z.string(),
  content: z.string(),
});

export const EdgeSchema = z.object({
  from: FacetIdEnum,
  to: FacetIdEnum,
  label: z.string(),
});

export const ExtractionSchema = z.object({
  facets: z.array(FacetSchema),
  edges: z.array(EdgeSchema),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
