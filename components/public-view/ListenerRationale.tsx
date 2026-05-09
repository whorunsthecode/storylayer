import { FACET_LABELS } from '@/lib/labels';
import type { FacetId } from '@/lib/types/pitch';

interface Props {
  reasoning: string;
  selected: FacetId[];
  totalAvailable: number;
}

export function ListenerRationale({ reasoning, selected, totalAvailable }: Props) {
  return (
    <aside className="listener-rationale">
      <div className="listener-rationale-label">→ agent rendered this for you</div>
      <p className="listener-rationale-text">{reasoning}</p>
      <div className="listener-rationale-meta">
        <span>
          <span className="listener-meta-key">surfaced</span> {selected.length} of {totalAvailable}
        </span>
        <span className="listener-rationale-chips">
          {selected.map((id) => (
            <span key={id} className="listener-chip">
              {FACET_LABELS[id]}
            </span>
          ))}
        </span>
      </div>
    </aside>
  );
}
