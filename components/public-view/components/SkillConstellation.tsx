import type { Facet } from '@/lib/types/pitch';
import { FACET_LABELS } from '@/lib/labels';

export function SkillConstellation({ facet }: { facet: Facet }) {
  const skills = facet.skills ?? [];
  if (skills.length === 0) {
    return (
      <article className="cmp cmp-facet-card">
        <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
        <h3 className="cmp-title">{facet.title}</h3>
        <p className="cmp-body">{facet.content}</p>
      </article>
    );
  }
  return (
    <article className="cmp cmp-constellation">
      <div className="cmp-eyebrow">{FACET_LABELS[facet.id]}</div>
      <h3 className="cmp-title">{facet.title}</h3>
      <div className="cmp-pills">
        {skills.map((s, i) => (
          <span key={i} className={`cmp-pill cmp-pill-w${s.weight}`}>
            {s.name}
          </span>
        ))}
      </div>
      {facet.content && <p className="cmp-body cmp-constellation-caption">{facet.content}</p>}
    </article>
  );
}
