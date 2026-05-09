import { z } from 'zod';
import { ComponentTypeEnum, FacetSchema } from './extraction';

export type PullAction = 'dig-deeper' | 'show-proof' | 'what-made-this' | 'connect-it';

export const PULL_ACTION_INTENTS: Record<PullAction, { label: string; intent: string; preferTypes: string[] }> = {
  'dig-deeper': {
    label: 'Dig deeper',
    intent: 'Reveal the narrative depth — what was implicit in the original facet. Surface a backstory, principle, or ground truth that makes the facet land harder.',
    preferTypes: ['chapter-spread', 'facet-card'],
  },
  'show-proof': {
    label: 'Show proof',
    intent: 'Surface concrete evidence: numbers, named projects, named people, dated outcomes. Whatever in the corpus most directly substantiates the facet.',
    preferTypes: ['metric-grid', 'node-graph'],
  },
  'what-made-this': {
    label: 'What made this',
    intent: 'Tell the journey behind the quality. The formative moment(s), the pivot, the lessons that produced this facet.',
    preferTypes: ['timeline-strip', 'chapter-spread'],
  },
  'connect-it': {
    label: 'Connect it',
    intent: 'Show the relationships between this facet and other dimensions of the storyteller — domains, projects, collaborators.',
    preferTypes: ['node-graph'],
  },
};

// The pull response is a SINGLE new facet-shaped object. We reuse the FacetSchema shape, but
// allow any facet id (since pulls aren't bound to the canonical 10) and require a componentType.
// This keeps render code identical to canonical facets — just a Facet that lives in a thread.
export const PullResponseSchema = z.object({
  componentType: ComponentTypeEnum,
  title: z.string(),
  content: z.string(),
  emphasis: z.string().optional(),
  metrics: FacetSchema.shape.metrics,
  events: FacetSchema.shape.events,
  nodes: FacetSchema.shape.nodes,
  connections: FacetSchema.shape.connections,
  skills: FacetSchema.shape.skills,
  quote: z.string().optional(),
  eyebrow: z.string().optional(),
});

export type PullResponse = z.infer<typeof PullResponseSchema>;
