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

export const ComponentTypeEnum = z.enum([
  'node-graph',
  'metric-grid',
  'timeline-strip',
  'quote-manifesto',
  'skill-constellation',
  'chapter-spread',
  'facet-card',
]);

const MetricSchema = z.object({
  value: z.string().describe('the headline number itself, e.g. "120k", "$4.2M"'),
  label: z.string().describe('what the number measures, e.g. "weekly users"'),
  context: z.string().optional().describe('where/when, e.g. "at Preface, 2022"'),
});

const TimelineEventSchema = z.object({
  eyebrow: z.string().describe('a year, era, or short tag e.g. "2021" or "early days"'),
  title: z.string(),
  content: z.string(),
});

const GraphNodeSchema = z.object({
  id: z.string().describe('short kebab-case id unique within this facet'),
  label: z.string(),
  hint: z.string().optional(),
});

const GraphConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().describe('a short verb phrase: "drives", "shaped", "demonstrates"'),
});

const SkillPillSchema = z.object({
  name: z.string(),
  weight: z.number().int().min(1).max(3).describe('1 = small/faded, 2 = medium, 3 = large/full opacity'),
});

export const FacetSchema = z.object({
  id: FacetIdEnum,
  title: z.string(),
  content: z.string().describe('plain prose, used as fallback or accessible text'),
  componentType: ComponentTypeEnum,
  metrics: z.array(MetricSchema).optional(),
  events: z.array(TimelineEventSchema).optional(),
  nodes: z.array(GraphNodeSchema).optional(),
  connections: z.array(GraphConnectionSchema).optional(),
  skills: z.array(SkillPillSchema).optional(),
  quote: z.string().optional(),
  eyebrow: z.string().optional(),
});

export const ExtractionSchema = z.object({
  facets: z.array(FacetSchema),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
