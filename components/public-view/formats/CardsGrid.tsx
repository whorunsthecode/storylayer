import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function CardsGrid({ facets }: { facets: Facet[]; edges: never[] }) {
  return (
    <div className="format-cards-grid">
      {facets.map((f) => (
        <article key={f.id} className="pv-card">
          <div className="pv-card-title">{f.title}</div>
          <div
            style={{
              fontFamily: 'var(--reg-mono, var(--mono-font))',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--muted-light)',
              marginBottom: 8,
            }}
          >
            {FACET_LABELS[f.id]}
          </div>
          <p className="pv-card-content">{f.content}</p>
        </article>
      ))}
    </div>
  );
}
