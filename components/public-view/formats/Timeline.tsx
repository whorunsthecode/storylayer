import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function Timeline({ facets }: { facets: Facet[]; edges: never[] }) {
  return (
    <ol className="format-timeline" style={{ listStyle: 'none' }}>
      {facets.map((f) => (
        <li key={f.id} className="tl-item">
          <span className="tl-marker" />
          <div className="tl-eyebrow">{FACET_LABELS[f.id]}</div>
          <div className="tl-title">{f.title}</div>
          <p className="tl-content">{f.content}</p>
        </li>
      ))}
    </ol>
  );
}
