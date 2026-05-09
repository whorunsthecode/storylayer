import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function FacetCardComponent({ facet }: { facet: Facet }) {
  return (
    <article className="cmp cmp-facet-card">
      <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
      <h3 className="cmp-title">{facet.title}</h3>
      <p className="cmp-body">{facet.content}</p>
    </article>
  );
}
