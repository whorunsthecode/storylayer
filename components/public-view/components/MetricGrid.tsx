import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function MetricGrid({ facet }: { facet: Facet }) {
  const metrics = facet.metrics ?? [];
  if (metrics.length === 0) {
    return (
      <article className="cmp cmp-facet-card">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
        <p className="cmp-body">{facet.content}</p>
      </article>
    );
  }
  return (
    <article className="cmp cmp-metrics">
      <div className="cmp-metrics-head">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
      </div>
      <div className="cmp-metrics-grid">
        {metrics.map((m, i) => (
          <div key={i} className="cmp-metric-tile">
            <div className="cmp-metric-value">{m.value}</div>
            <div className="cmp-metric-label">{m.label}</div>
            {m.context && <div className="cmp-metric-context">{m.context}</div>}
          </div>
        ))}
      </div>
      {facet.content && <p className="cmp-metrics-caption">{facet.content}</p>}
    </article>
  );
}
