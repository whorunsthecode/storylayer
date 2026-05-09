import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function TimelineStrip({ facet }: { facet: Facet }) {
  const events = facet.events ?? [];
  if (events.length === 0) {
    return (
      <article className="cmp cmp-facet-card">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
        <p className="cmp-body">{facet.content}</p>
      </article>
    );
  }
  return (
    <article className="cmp cmp-timeline">
      <div className="cmp-timeline-head">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
      </div>
      <ol className="cmp-timeline-strip">
        {events.map((e, i) => (
          <li key={i} className="cmp-timeline-event">
            <div className="cmp-timeline-marker" />
            <div className="cmp-timeline-eyebrow">{e.eyebrow}</div>
            <div className="cmp-timeline-title">{e.title}</div>
            <p className="cmp-timeline-content">{e.content}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
