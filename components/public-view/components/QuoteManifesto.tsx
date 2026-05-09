import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function QuoteManifesto({ facet }: { facet: Facet }) {
  const quote = facet.quote ?? facet.content;
  return (
    <article className="cmp cmp-manifesto">
      <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
      <blockquote className="cmp-manifesto-quote">{quote}</blockquote>
      {facet.quote && facet.content && facet.quote !== facet.content && (
        <p className="cmp-manifesto-caption">{facet.content}</p>
      )}
    </article>
  );
}
