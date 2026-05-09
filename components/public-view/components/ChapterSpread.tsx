import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function ChapterSpread({ facet }: { facet: Facet }) {
  return (
    <article className="cmp cmp-chapter">
      <div className="cmp-eyebrow">
        {facet.eyebrow ?? FACET_LABELS[facet.id]}
      </div>
      <h2 className="cmp-chapter-title">{facet.title}</h2>
      <p className="cmp-chapter-body">{facet.content}</p>
    </article>
  );
}
